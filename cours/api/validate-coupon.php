<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
require_once __DIR__ . '/_log.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$coupon = isset($input['coupon']) ? strtoupper(trim($input['coupon'])) : '';

if (empty($coupon)) {
    echo json_encode(['success' => false, 'error' => 'invalid']);
    exit;
}

$dataDir = __DIR__ . '/../data/';
$couponsFile = $dataDir . 'coupons.json';

if (!file_exists($couponsFile)) {
    echo json_encode(['success' => false, 'error' => 'server']);
    exit;
}

$coupons = json_decode(file_get_contents($couponsFile), true);
if (!$coupons) {
    echo json_encode(['success' => false, 'error' => 'server']);
    exit;
}

if (!isset($coupons[$coupon])) {
    aurel_log('login_invalid', ['code' => $coupon]);
    echo json_encode(['success' => false, 'error' => 'invalid']);
    exit;
}

function getClientIP() {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP'];
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    return $_SERVER['REMOTE_ADDR'];
}

function getTier($code) {
    if (strpos($code, 'AC-') === 0) return 'AC';
    if (strpos($code, 'AU-') === 0) return 'AU';
    return 'AU';
}

$clientIP = getClientIP();
$entry = $coupons[$coupon];
$tier = getTier($coupon);

if ($entry['status'] === 'revoked') {
    aurel_log('login_revoked', ['code' => $coupon]);
    echo json_encode(['success' => false, 'error' => 'revoked']);
    exit;
}

// Première activation : marque le coupon comme "used" sans binder l'IP.
// On garde l'IP juste pour info dans le Sheet admin (auditing), pas pour bloquer.
if ($entry['status'] === 'available') {
    $coupons[$coupon] = [
        'status' => 'used',
        'tier' => $tier,
        'ip' => $clientIP,           // info only — pas utilisé pour blocage
        'firstSeenIP' => $clientIP,  // historique : 1ère IP qui a activé
        'activated' => date('c'),
        'lastActivity' => date('c')
    ];

    file_put_contents($couponsFile, json_encode($coupons, JSON_PRETTY_PRINT), LOCK_EX);

    $hash = hash('sha256', $coupon);
    $progressDir = $dataDir . 'progress/';
    if (!is_dir($progressDir)) {
        mkdir($progressDir, 0755, true);
    }
    $progressFile = $progressDir . $hash . '.json';
    if (!file_exists($progressFile)) {
        $progress = [
            'coupon' => $coupon,
            'tier' => $tier,
            'courses' => new \stdClass(),
            'lastCourse' => null,
            'lastWatched' => date('c')
        ];
        file_put_contents($progressFile, json_encode($progress, JSON_PRETTY_PRINT), LOCK_EX);
    }

    aurel_log('login_activated', ['code' => $coupon, 'tier' => $tier, 'ip' => $clientIP]);
    echo json_encode(['success' => true, 'tier' => $tier]);
    exit;

// Coupon déjà utilisé : on autorise depuis n'importe quelle IP (plus de blocage).
// On met juste à jour lastActivity + on log l'IP courante pour traçabilité.
} elseif ($entry['status'] === 'used') {
    $coupons[$coupon]['lastActivity'] = date('c');
    // Log si l'IP change vs la 1ère activation (utile pour détecter du partage)
    $firstIP = isset($entry['firstSeenIP']) ? $entry['firstSeenIP'] : $entry['ip'];
    if ($clientIP !== $firstIP) {
        $coupons[$coupon]['lastIP'] = $clientIP;
        aurel_log('login_new_ip', ['code' => $coupon, 'firstIP' => $firstIP, 'newIP' => $clientIP]);
    }
    file_put_contents($couponsFile, json_encode($coupons, JSON_PRETTY_PRINT), LOCK_EX);

    aurel_log('login_success', ['code' => $coupon]);
    echo json_encode(['success' => true, 'tier' => $tier]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'server']);
