<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$password = isset($input['password']) ? $input['password'] : '';
$countAU = isset($input['countAU']) ? (int)$input['countAU'] : 0;
$countAC = isset($input['countAC']) ? (int)$input['countAC'] : 0;

if ($password !== 'aurelacademy2026') {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

if ($countAU < 0 || $countAU > 500 || $countAC < 0 || $countAC > 500) {
    echo json_encode(['success' => false, 'error' => 'out_of_range']);
    exit;
}

$dataDir = __DIR__ . '/../data/';
$couponsFile = $dataDir . 'coupons.json';

$coupons = [];
if (file_exists($couponsFile)) {
    $coupons = json_decode(file_get_contents($couponsFile), true) ?: [];
}

function genCode($prefix, $existing) {
    do {
        $hex = strtoupper(bin2hex(random_bytes(3)));
        $code = $prefix . '-' . $hex;
    } while (isset($existing[$code]));
    return $code;
}

$newCodes = [];
for ($i = 0; $i < $countAU; $i++) {
    $code = genCode('AU', $coupons);
    $coupons[$code] = ['status' => 'available', 'tier' => 'AU', 'ip' => null, 'activated' => null, 'lastActivity' => null];
    $newCodes[] = $code;
}
for ($i = 0; $i < $countAC; $i++) {
    $code = genCode('AC', $coupons);
    $coupons[$code] = ['status' => 'available', 'tier' => 'AC', 'ip' => null, 'activated' => null, 'lastActivity' => null];
    $newCodes[] = $code;
}

file_put_contents($couponsFile, json_encode($coupons, JSON_PRETTY_PRINT), LOCK_EX);

echo json_encode(['success' => true, 'generated' => count($newCodes), 'codes' => $newCodes]);
