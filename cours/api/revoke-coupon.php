<?php
header('Content-Type: application/json');
require_once __DIR__ . '/_log.php';
require_once __DIR__ . '/_secrets.php';
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

$couponsFile = __DIR__ . '/../data/coupons.json';
if (!file_exists($couponsFile)) {
    echo json_encode(['success' => false, 'error' => 'server']);
    exit;
}

// SHERLOCK R14 — C2 : atomic revoke. Sans ça un admin qui revoke pendant
// qu'un étudiant active le même code pouvait perdre la revoke (last write
// wins → état 'used' final). Maintenant on lock, on check existence, on
// flip status, on release.
$notFound = false;
$ok = aurel_atomic_json($couponsFile, function($coupons) use ($code, &$notFound) {
    if (!isset($coupons[$code])) {
        $notFound = true;
        return null;
    }
    $coupons[$code]['status'] = 'revoked';
    $coupons[$code]['revokedAt'] = date('c');
    return $coupons;
});

if (!$ok) {
    if ($notFound) {
        echo json_encode(['success' => false, 'error' => 'not_found']);
        exit;
    }
    echo json_encode(['success' => false, 'error' => 'server']);
    exit;
}

aurel_log('admin_revoke', ['code' => $code]);

echo json_encode(['success' => true]);
