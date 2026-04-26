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

$dataDir = __DIR__ . '/../data/';
$couponsFile = $dataDir . 'coupons.json';

if (!file_exists($couponsFile)) {
    echo json_encode(['success' => false, 'error' => 'server']);
    exit;
}

$coupons = json_decode(file_get_contents($couponsFile), true);
if (!isset($coupons[$coupon]) || $coupons[$coupon]['status'] !== 'used') {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

$tier = isset($coupons[$coupon]['tier']) ? $coupons[$coupon]['tier'] : (strpos($coupon, 'AC-') === 0 ? 'AC' : 'AU');
$hash = hash('sha256', $coupon);
$progressFile = $dataDir . 'progress/' . $hash . '.json';

if (file_exists($progressFile)) {
    $progress = json_decode(file_get_contents($progressFile), true);
    if (!isset($progress['tier'])) $progress['tier'] = $tier;
    echo json_encode(['success' => true, 'progress' => $progress]);
} else {
    echo json_encode(['success' => true, 'progress' => [
        'coupon' => $coupon,
        'tier' => $tier,
        'courses' => new \stdClass(),
        'lastCourse' => null,
        'lastWatched' => null
    ]]);
}
