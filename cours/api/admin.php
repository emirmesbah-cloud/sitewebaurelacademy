<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false]);
    exit;
}

require_once __DIR__ . '/_secrets.php';

$input = json_decode(file_get_contents('php://input'), true);
$password = isset($input['password']) ? $input['password'] : '';

if ($password !== ADMIN_PWD) {
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

$totals = ['total' => 0, 'used' => 0, 'available' => 0, 'auTotal' => 0, 'auUsed' => 0, 'acTotal' => 0, 'acUsed' => 0];
$couponList = [];
$totalCompleted = 0;
$totalModuleCount = 0;

foreach ($coupons as $code => $entry) {
    $totals['total']++;
    $tier = isset($entry['tier']) ? $entry['tier'] : (strpos($code, 'AC-') === 0 ? 'AC' : 'AU');

    if ($tier === 'AC') $totals['acTotal']++;
    else $totals['auTotal']++;

    if ($entry['status'] === 'used') {
        $totals['used']++;
        if ($tier === 'AC') $totals['acUsed']++;
        else $totals['auUsed']++;
    } else {
        $totals['available']++;
    }

    $completedCount = null;
    $courseCount = 0;
    if ($entry['status'] === 'used') {
        $hash = hash('sha256', $code);
        $progressFile = $dataDir . 'progress/' . $hash . '.json';
        if (file_exists($progressFile)) {
            $progress = json_decode(file_get_contents($progressFile), true);
            if (isset($progress['courses']) && is_array($progress['courses'])) {
                $completedCount = 0;
                foreach ($progress['courses'] as $cid => $cdata) {
                    if (isset($cdata['completed']) && is_array($cdata['completed'])) {
                        $completedCount += count($cdata['completed']);
                    }
                    $courseCount++;
                }
                $totalCompleted += $completedCount;
                $totalModuleCount += 10;
            }
        }
    }

    $couponList[] = [
        'code' => $code,
        'tier' => $tier,
        'status' => $entry['status'],
        'ip' => isset($entry['ip']) ? $entry['ip'] : null,
        'activated' => isset($entry['activated']) ? $entry['activated'] : null,
        'lastActivity' => isset($entry['lastActivity']) ? $entry['lastActivity'] : null,
        'completed' => $completedCount,
        'courses' => $courseCount
    ];
}

$avgProgress = $totalModuleCount > 0 ? round(($totalCompleted / $totalModuleCount) * 100) : 0;

echo json_encode([
    'success' => true,
    'stats' => array_merge($totals, ['avgProgress' => $avgProgress]),
    'coupons' => $couponList
]);
