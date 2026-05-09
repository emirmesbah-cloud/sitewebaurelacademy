<?php
header('Content-Type: application/json');
require_once __DIR__ . '/_secrets.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$password = isset($input['password']) ? $input['password'] : '';

if ($password !== ADMIN_PWD) {
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
