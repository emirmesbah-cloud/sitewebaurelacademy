<?php
// Activity logger — included by other endpoints
// Logs events to data/logs.json (keeps last 500)

require_once __DIR__ . '/_cf_ips.php';

if (!function_exists('aurel_log')) {
    function aurel_log($event, $details = []) {
        $logFile = __DIR__ . '/../data/logs.json';

        // SHERLOCK R13 — only trust CF-Connecting-IP when REMOTE_ADDR is a CF edge IP.
        $ip = function_exists('aurel_client_ip') ? aurel_client_ip() : ($_SERVER['REMOTE_ADDR'] ?? 'unknown');

        $entry = array_merge([
            'ts' => date('c'),
            'event' => $event,
            'ip' => $ip,
            'ua' => isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 150) : ''
        ], $details);

        // SHERLOCK R13 — atomic read-modify-write via flock on a single handle.
        $fp = @fopen($logFile, 'c+');
        if (!$fp) return;
        if (!flock($fp, LOCK_EX)) {
            fclose($fp);
            return;
        }
        $raw = stream_get_contents($fp);
        $logs = json_decode($raw ?: '[]', true);
        if (!is_array($logs)) $logs = [];

        $logs[] = $entry;
        if (count($logs) > 500) $logs = array_slice($logs, -500);

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($logs, JSON_PRETTY_PRINT));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}
