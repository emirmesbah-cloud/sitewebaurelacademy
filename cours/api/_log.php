<?php
// Activity logger — included by other endpoints
// Logs events to data/logs.json (keeps last 500)

if (!function_exists('aurel_log')) {
    function aurel_log($event, $details = []) {
        $logFile = __DIR__ . '/../data/logs.json';
        $logs = [];
        if (file_exists($logFile)) {
            $logs = json_decode(file_get_contents($logFile), true) ?: [];
        }
        $ip = 'unknown';
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
        elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $ip = trim($ips[0]);
        } elseif (!empty($_SERVER['REMOTE_ADDR'])) $ip = $_SERVER['REMOTE_ADDR'];

        $logs[] = array_merge([
            'ts' => date('c'),
            'event' => $event,
            'ip' => $ip,
            'ua' => isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 150) : ''
        ], $details);

        // Keep only last 500 entries
        if (count($logs) > 500) $logs = array_slice($logs, -500);
        file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT), LOCK_EX);
    }
}
