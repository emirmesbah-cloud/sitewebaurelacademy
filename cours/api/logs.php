<?php
header('Content-Type: application/json');
require_once __DIR__ . '/_secrets.php';
require_once __DIR__ . '/_log.php';
require_once __DIR__ . '/_rate_limit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false]);
    exit;
}

// SHERLOCK R13 — rate-limit before reading password (10 attempts / 5 min / IP)
aurel_rate_limit_or_die('admin', 10, 300);

$input = json_decode(file_get_contents('php://input'), true);
$password = isset($input['password']) ? $input['password'] : '';

// SHERLOCK R13 — timing-safe password compare
if (!hash_equals(ADMIN_PWD, $password ?? '')) {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

$logFile = __DIR__ . '/../data/logs.json';
$logs = [];
if (file_exists($logFile)) {
    $logs = json_decode(file_get_contents($logFile), true) ?: [];
}

// Return last 200 reversed (newest first)
$logs = array_slice($logs, -200);
$logs = array_reverse($logs);

echo json_encode(['success' => true, 'logs' => $logs]);
