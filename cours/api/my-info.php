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
// SHERLOCK R14 — M11 : on ne retourne PLUS l'IP au client. Le student n'a
// aucun besoin de la voir, et l'exposer permet à un script tournant dans
// le browser (extension malveillante, XSS futur) d'extraire l'IP de tous
// les users d'un coupon partagé. L'IP reste en DB pour l'audit admin
// (logs.json + coupons.json côté serveur).
echo json_encode([
    'success' => true,
    'code' => $coupon,
    'tier' => isset($entry['tier']) ? $entry['tier'] : (strpos($coupon, 'AC-') === 0 ? 'AC' : 'AU'),
    'status' => $entry['status'],
    'activated' => isset($entry['activated']) ? $entry['activated'] : null,
    'lastActivity' => isset($entry['lastActivity']) ? $entry['lastActivity'] : null,
]);
