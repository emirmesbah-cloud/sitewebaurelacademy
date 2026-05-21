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
$code = isset($input['code']) ? strtoupper(trim($input['code'])) : '';

// SHERLOCK R13 — timing-safe password compare
if (!hash_equals(ADMIN_PWD, $password ?? '')) {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

// SHERLOCK R13 — A5: audit trail for admin viewing a coupon detail
aurel_log('admin_view_coupon', ['code' => $code]);

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
