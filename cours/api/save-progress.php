<?php
header('Content-Type: application/json');
require_once __DIR__ . '/_log.php';

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

// SHERLOCK R14 — C2 : atomic update de coupons.json (lastActivity).
// Captures aussi le tier dans la closure pour usage post-lock.
$tier = null;
$authorized = false;
aurel_atomic_json($couponsFile, function($coupons) use ($coupon, &$tier, &$authorized) {
    if (!isset($coupons[$coupon]) || $coupons[$coupon]['status'] !== 'used') {
        return null; // abort, no write
    }
    $authorized = true;
    $tier = isset($coupons[$coupon]['tier'])
        ? $coupons[$coupon]['tier']
        : (strpos($coupon, 'AC-') === 0 ? 'AC' : 'AU');
    $coupons[$coupon]['lastActivity'] = date('c');
    return $coupons;
});

if (!$authorized) {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

$hash = hash('sha256', $coupon);
$progressDir = $dataDir . 'progress/';
if (!is_dir($progressDir)) mkdir($progressDir, 0755, true);
$progressFile = $progressDir . $hash . '.json';

// SHERLOCK R14 — C2 : atomic update du progress file. Sans ça, 2 onglets
// ouverts pouvaient race et écraser les `completed` lessons de l'autre.
$progressOk = aurel_atomic_json($progressFile, function($existing) use ($coupon, $tier, $courseId, $input) {
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
    return $existing;
});

if (!$progressOk) {
    echo json_encode(['success' => false, 'error' => 'server']);
    exit;
}

echo json_encode(['success' => true]);
