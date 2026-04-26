<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$coupon = isset($input['coupon']) ? strtoupper(trim($input['coupon'])) : '';
$courseId = isset($input['courseId']) ? preg_replace('/[^a-z0-9_-]/', '', strtolower($input['courseId'])) : '';

if (empty($coupon) || empty($courseId)) {
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

$coupons[$coupon]['lastActivity'] = date('c');
file_put_contents($couponsFile, json_encode($coupons, JSON_PRETTY_PRINT), LOCK_EX);

$tier = isset($coupons[$coupon]['tier']) ? $coupons[$coupon]['tier'] : (strpos($coupon, 'AC-') === 0 ? 'AC' : 'AU');
$hash = hash('sha256', $coupon);
$progressDir = $dataDir . 'progress/';
if (!is_dir($progressDir)) mkdir($progressDir, 0755, true);
$progressFile = $progressDir . $hash . '.json';

$existing = [];
if (file_exists($progressFile)) {
    $existing = json_decode(file_get_contents($progressFile), true) ?: [];
}

if (!isset($existing['courses']) || !is_array($existing['courses'])) {
    $existing['courses'] = [];
}

$courseData = isset($existing['courses'][$courseId]) ? $existing['courses'][$courseId] : [
    'completed' => [],
    'lastLesson' => 0,
    'timestamps' => []
];

if (isset($input['completed']) && is_array($input['completed'])) {
    $courseData['completed'] = $input['completed'];
}
if (isset($input['lastLesson'])) {
    $courseData['lastLesson'] = (int)$input['lastLesson'];
}
if (isset($input['timestamps']) && is_array($input['timestamps'])) {
    $courseData['timestamps'] = $input['timestamps'];
}
$courseData['lastWatched'] = date('c');

$existing['coupon'] = $coupon;
$existing['tier'] = $tier;
$existing['courses'][$courseId] = $courseData;
$existing['lastCourse'] = $courseId;
$existing['lastWatched'] = date('c');

file_put_contents($progressFile, json_encode($existing, JSON_PRETTY_PRINT), LOCK_EX);

echo json_encode(['success' => true]);
