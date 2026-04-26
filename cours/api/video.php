<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$videoId = isset($input['videoId']) ? trim($input['videoId']) : '';
$coupon = isset($input['coupon']) ? strtoupper(trim($input['coupon'])) : '';

if (empty($videoId) || empty($coupon)) {
    echo json_encode(['error' => 'missing']);
    exit;
}

$couponsFile = __DIR__ . '/../data/coupons.json';
if (!file_exists($couponsFile)) {
    echo json_encode(['error' => 'server']);
    exit;
}

$coupons = json_decode(file_get_contents($couponsFile), true);
if (!$coupons || !isset($coupons[$coupon]) || $coupons[$coupon]['status'] !== 'used') {
    echo json_encode(['error' => 'unauthorized']);
    exit;
}

if (!function_exists('curl_init')) {
    echo json_encode(['error' => 'server']);
    exit;
}

// VDOCipher API secret — shared account with Naim Keys
// TODO: replace with dedicated Aurel account secret when available
$apiSecret = 'kwY47RVctb3rWoL6Ov00MB2r6lCLRVX5gYadPd3tJCMJgRKQ9QApoxH0iTxq4yb4';

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://dev.vdocipher.com/api/videos/' . $videoId . '/otp',
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['ttl' => 300]),
    CURLOPT_HTTPHEADER => [
        'Authorization: Apisecret ' . $apiSecret,
        'Content-Type: application/json',
        'Accept: application/json'
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => 0
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    echo json_encode(['error' => 'curl']);
    exit;
}

if ($httpCode === 200 && $response) {
    $data = json_decode($response, true);
    if (isset($data['otp']) && isset($data['playbackInfo'])) {
        echo json_encode([
            'otp' => $data['otp'],
            'playbackInfo' => $data['playbackInfo']
        ]);
    } else {
        echo json_encode(['error' => 'vdo_response']);
    }
} else {
    echo json_encode(['error' => 'vdo_api', 'code' => $httpCode]);
}
