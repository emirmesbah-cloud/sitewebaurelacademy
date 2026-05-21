<?php
// SHERLOCK R13 — Basic file-backed rate limiter for admin endpoints
// Storage: data/rate_limit.json { "<key>": [ {"ts": <epoch> }, ... ] }
// Atomic read-modify-write via flock on the file handle.

require_once __DIR__ . '/_cf_ips.php';

if (!function_exists('aurel_rate_limit')) {
    function aurel_rate_limit($key, $maxAttempts = 10, $windowSec = 300) {
        $dataDir = __DIR__ . '/../data/';
        if (!is_dir($dataDir)) @mkdir($dataDir, 0755, true);
        $file = $dataDir . 'rate_limit.json';

        $fp = @fopen($file, 'c+');
        if (!$fp) return true; // fail open if we can't open the file
        if (!flock($fp, LOCK_EX)) {
            fclose($fp);
            return true; // fail open on lock failure
        }

        $raw = stream_get_contents($fp);
        $data = json_decode($raw ?: '{}', true);
        if (!is_array($data)) $data = [];

        $now = time();
        $cutoff = $now - $windowSec;

        // Garbage-collect: drop entries older than cutoff per key, drop empty keys.
        // To keep the file small, also GC ALL keys opportunistically.
        foreach ($data as $k => $entries) {
            if (!is_array($entries)) { unset($data[$k]); continue; }
            $kept = [];
            foreach ($entries as $e) {
                if (isset($e['ts']) && (int)$e['ts'] >= $cutoff) $kept[] = $e;
            }
            if (empty($kept)) unset($data[$k]);
            else $data[$k] = $kept;
        }

        $current = isset($data[$key]) ? $data[$key] : [];
        $allowed = count($current) < $maxAttempts;

        if ($allowed) {
            $current[] = ['ts' => $now];
            $data[$key] = $current;
        }

        // Write back
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        return $allowed;
    }
}

if (!function_exists('aurel_rate_limit_or_die')) {
    function aurel_rate_limit_or_die($scope, $maxAttempts = 10, $windowSec = 300) {
        $ip = function_exists('aurel_client_ip') ? aurel_client_ip() : ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $key = $scope . ':' . $ip;
        if (!aurel_rate_limit($key, $maxAttempts, $windowSec)) {
            http_response_code(429);
            header('Content-Type: application/json');
            header('Retry-After: ' . $windowSec);
            if (function_exists('aurel_log')) {
                aurel_log('rate_limited', ['scope' => $scope, 'ip' => $ip]);
            }
            echo json_encode(['success' => false, 'error' => 'rate_limited']);
            exit;
        }
    }
}
