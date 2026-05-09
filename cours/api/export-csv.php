<?php
require_once __DIR__ . '/_secrets.php';
$password = isset($_GET['password']) ? $_GET['password'] : '';

if ($password !== ADMIN_PWD) {
    http_response_code(403);
    echo 'Unauthorized';
    exit;
}

$dataDir = __DIR__ . '/../data/';
$couponsFile = $dataDir . 'coupons.json';

if (!file_exists($couponsFile)) {
    http_response_code(500);
    echo 'No data';
    exit;
}

$coupons = json_decode(file_get_contents($couponsFile), true);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="aurel-coupons-' . date('Y-m-d') . '.csv"');

$out = fopen('php://output', 'w');
fputs($out, "\xEF\xBB\xBF"); // UTF-8 BOM
fputcsv($out, ['code', 'tier', 'status', 'ip', 'activated', 'lastActivity', 'completedModules']);

foreach ($coupons as $code => $e) {
    $tier = isset($e['tier']) ? $e['tier'] : (strpos($code, 'AC-') === 0 ? 'AC' : 'AU');
    $completed = '';
    if ($e['status'] === 'used') {
        $hash = hash('sha256', $code);
        $pf = $dataDir . 'progress/' . $hash . '.json';
        if (file_exists($pf)) {
            $p = json_decode(file_get_contents($pf), true);
            $sum = 0;
            if (isset($p['courses'])) {
                foreach ($p['courses'] as $c) {
                    if (isset($c['completed'])) $sum += count($c['completed']);
                }
            }
            $completed = $sum;
        }
    }
    fputcsv($out, [$code, $tier, $e['status'], $e['ip'] ?? '', $e['activated'] ?? '', $e['lastActivity'] ?? '', $completed]);
}

fclose($out);
