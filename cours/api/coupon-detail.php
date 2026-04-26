<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$password = isset($input['password']) ? $input['password'] : '';
$code = isset($input['code']) ? strtoupper(trim($input['code'])) : '';

if ($password !== 'aurelacademy2026') {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

$dataDir = __DIR__ . '/../data/';
$couponsFile = $dataDir . 'coupons.json';

if (!file_exists($couponsFile)) {
    echo json_encode(['success' => false, 'error' => 'server']);
    exit;
}

$coupons = json_decode(file_get_contents($couponsFile), true);
if (!isset($coupons[$code])) {
    echo json_encode(['success' => false, 'error' => 'not_found']);
    exit;
}

$entry = $coupons[$code];
$progress = null;

if ($entry['status'] === 'used') {
    $hash = hash('sha256', $code);
    $progressFile = $dataDir . 'progress/' . $hash . '.json';
    if (file_exists($progressFile)) {
        $progress = json_decode(file_get_contents($progressFile), true);
    }
}

echo json_encode([
    'success' => true,
    'coupon' => array_merge(['code' => $code], $entry),
    'progress' => $progress
]);
