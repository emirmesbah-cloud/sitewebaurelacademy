<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$coupon = isset($input['coupon']) ? strtoupper(trim($input['coupon'])) : '';

if (empty($coupon)) {
    echo json_encode(['success' => false, 'error' => 'missing']);
    exit;
}

$couponsFile = __DIR__ . '/../data/coupons.json';
if (!file_exists($couponsFile)) {
    echo json_encode(['success' => false, 'error' => 'server']);
    exit;
}

$coupons = json_decode(file_get_contents($couponsFile), true);
if (!isset($coupons[$coupon]) || $coupons[$coupon]['status'] !== 'used') {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

$entry = $coupons[$coupon];
echo json_encode([
    'success' => true,
    'code' => $coupon,
    'tier' => isset($entry['tier']) ? $entry['tier'] : (strpos($coupon, 'AC-') === 0 ? 'AC' : 'AU'),
    'status' => $entry['status'],
    'activated' => isset($entry['activated']) ? $entry['activated'] : null,
    'lastActivity' => isset($entry['lastActivity']) ? $entry['lastActivity'] : null,
    'ip' => isset($entry['ip']) ? $entry['ip'] : null
]);
