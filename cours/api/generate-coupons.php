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
$countAU = isset($input['countAU']) ? (int)$input['countAU'] : 0;
$countAC = isset($input['countAC']) ? (int)$input['countAC'] : 0;

// SHERLOCK R13 — timing-safe password compare
if (!hash_equals(ADMIN_PWD, $password ?? '')) {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

if ($countAU < 0 || $countAU > 500 || $countAC < 0 || $countAC > 500) {
    echo json_encode(['success' => false, 'error' => 'out_of_range']);
    exit;
}

$dataDir = __DIR__ . '/../data/';
$couponsFile = $dataDir . 'coupons.json';

function genCode($prefix, $existing) {
    do {
        $hex = strtoupper(bin2hex(random_bytes(3)));
        $code = $prefix . '-' . $hex;
    } while (isset($existing[$code]));
    return $code;
}

// SHERLOCK R14 — C2 : atomic generation. Avant : 2 admins (ou 1 admin
// double-click) pouvaient passer les codes générés du 2e write par-dessus
// le 1er → perte silencieuse de codes vendus. Maintenant on lock, on lit
// le state existant DANS la closure (pas avant), on append, on release.
$newCodes = [];
$ok = aurel_atomic_json($couponsFile, function($coupons) use ($countAU, $countAC, &$newCodes) {
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
    return $coupons;
});

if (!$ok) {
    echo json_encode(['success' => false, 'error' => 'server']);
    exit;
}

echo json_encode(['success' => true, 'generated' => count($newCodes), 'codes' => $newCodes]);
