<?php
// Activity logger — included by other endpoints
// Logs events to data/logs.json (keeps last 500)

require_once __DIR__ . '/_cf_ips.php';

// SHERLOCK R14 — C2 : helper atomic read-modify-write pour les fichiers JSON
// partagés (coupons.json, progress/*.json). Avant : tous les call sites
// faisaient file_get_contents + json_decode + file_put_contents(LOCK_EX),
// NON atomique → 2 requêtes concurrentes lisaient le même state et le
// dernier write écrasait l'autre (perte de coupon-revoke, perte de
// progression, etc.).
//
// Maintenant : flock + fopen('c+') + ftruncate dans une seule poignée,
// pattern identique à aurel_log() ci-dessous. Le callback reçoit le state
// décodé (array vide si fichier inexistant), retourne le nouveau state ;
// le helper handle locking + serialization. Retourne true sur success,
// false sur lock fail (le caller décide quoi faire — typiquement renvoyer
// une 500).
if (!function_exists('aurel_atomic_json')) {
    function aurel_atomic_json($file, callable $cb) {
        $dir = dirname($file);
        if (!is_dir($dir)) { @mkdir($dir, 0755, true); }
        $fp = @fopen($file, 'c+');
        if (!$fp) return false;
        if (!flock($fp, LOCK_EX)) {
            fclose($fp);
            return false;
        }
        $raw = stream_get_contents($fp);
        $data = $raw ? json_decode($raw, true) : [];
        if (!is_array($data)) $data = [];

        $newData = $cb($data);
        if ($newData === null) {
            // Callback signaled abort (e.g. validation failed mid-lock).
            flock($fp, LOCK_UN);
            fclose($fp);
            return false;
        }

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($newData, JSON_PRETTY_PRINT));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        return true;
    }
}

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
