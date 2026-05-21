<?php
header('Content-Type: application/json');

// SHERLOCK R13 — A3: strict CORS allowlist (was wildcard *).
$allowedOrigins = [
    'https://aurel-academy.com',
    'https://app.aurel-academy.com',
    'http://localhost:5173',
    'http://localhost:4173',
];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$corsOrigin = in_array($origin, $allowedOrigins, true) ? $origin : 'https://aurel-academy.com';
header('Access-Control-Allow-Origin: ' . $corsOrigin);
header('Vary: Origin');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/_log.php';
require_once __DIR__ . '/_cf_ips.php';

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
    // SHERLOCK R13 — A4: only trust CF-Connecting-IP when peer is a Cloudflare edge.
    if (function_exists('aurel_client_ip')) return aurel_client_ip();
    return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
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

// SHERLOCK R14 — C2 : remplace le pattern non-atomic (get_contents +
// put_contents LOCK_EX) par aurel_atomic_json(). 2 requêtes concurrentes
// activant le MÊME coupon ne peuvent plus race : la 2e voit le state déjà
// 'used' dans le callback et bail.
$outcome = null; // 'activated' | 'reused' | 'race_revoked' | 'race_unknown'
$ok = aurel_atomic_json($couponsFile, function($data) use ($coupon, $clientIP, $tier, &$outcome) {
    if (!isset($data[$coupon])) {
        // Quelqu'un l'a supprimé entre la lecture initiale et le lock — abort.
        $outcome = 'race_unknown';
        return null;
    }
    $row = $data[$coupon];

    if ($row['status'] === 'revoked') {
        $outcome = 'race_revoked';
        return null;
    }

    if ($row['status'] === 'available') {
        $data[$coupon] = [
            'status' => 'used',
            'tier' => $tier,
            'ip' => $clientIP,
            'firstSeenIP' => $clientIP,
            'activated' => date('c'),
            'lastActivity' => date('c'),
        ];
        $outcome = 'activated';
        return $data;
    }

    // status === 'used' : update lastActivity + log IP change
    $data[$coupon]['lastActivity'] = date('c');
    $firstIP = isset($row['firstSeenIP']) ? $row['firstSeenIP'] : (isset($row['ip']) ? $row['ip'] : null);
    if ($clientIP !== $firstIP) {
        $data[$coupon]['lastIP'] = $clientIP;
    }
    $outcome = 'reused';
    return $data;
});

if (!$ok) {
    if ($outcome === 'race_revoked') {
        aurel_log('login_revoked', ['code' => $coupon]);
        echo json_encode(['success' => false, 'error' => 'revoked']);
        exit;
    }
    echo json_encode(['success' => false, 'error' => 'server']);
    exit;
}

if ($outcome === 'activated') {
    $hash = hash('sha256', $coupon);
    $progressDir = $dataDir . 'progress/';
    if (!is_dir($progressDir)) {
        mkdir($progressDir, 0755, true);
    }
    $progressFile = $progressDir . $hash . '.json';
    if (!file_exists($progressFile)) {
        // Pas de race ici : un fichier unique au sha256(coupon) qu'on crée
        // seulement à la 1ère activation. L'atomic helper handle aussi
        // ce path si on veut être strict, mais c'est défensif.
        aurel_atomic_json($progressFile, function($existing) use ($coupon, $tier) {
            if (!empty($existing)) return $existing;
            return [
                'coupon' => $coupon,
                'tier' => $tier,
                'courses' => (object)[],
                'lastCourse' => null,
                'lastWatched' => date('c'),
            ];
        });
    }
    aurel_log('login_activated', ['code' => $coupon, 'tier' => $tier, 'ip' => $clientIP]);
    echo json_encode(['success' => true, 'tier' => $tier]);
    exit;
}

if ($outcome === 'reused') {
    // Log if IP change vs first activation (post-write so we know firstIP)
    $firstIP = isset($entry['firstSeenIP']) ? $entry['firstSeenIP'] : (isset($entry['ip']) ? $entry['ip'] : null);
    if ($clientIP !== $firstIP) {
        aurel_log('login_new_ip', ['code' => $coupon, 'firstIP' => $firstIP, 'newIP' => $clientIP]);
    }
    aurel_log('login_success', ['code' => $coupon]);
    echo json_encode(['success' => true, 'tier' => $tier]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'server']);
