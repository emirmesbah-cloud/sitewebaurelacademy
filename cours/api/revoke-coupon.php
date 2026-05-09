<?php
header('Content-Type: application/json');
require_once __DIR__ . '/_log.php';
require_once __DIR__ . '/_secrets.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$password = isset($input['password']) ? $input['password'] : '';
$code = isset($input['code']) ? strtoupper(trim($input['code'])) : '';

if ($password !== ADMIN_PWD) {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

$couponsFile = __DIR__ . '/../data/coupons.json';
if (!file_exists($couponsFile)) {
    echo json_encode(['success' => false, 'error' => 'server']);
    exit;
}

$coupons = json_decode(file_get_contents($couponsFile), true);
if (!isset($coupons[$code])) {
    echo json_encode(['success' => false, 'error' => 'not_found']);
    exit;
}

$coupons[$code]['status'] = 'revoked';
$coupons[$code]['revokedAt'] = date('c');
file_put_contents($couponsFile, json_encode($coupons, JSON_PRETTY_PRINT), LOCK_EX);

aurel_log('admin_revoke', ['code' => $code]);

echo json_encode(['success' => true]);
