<?php
// SHERLOCK R13 — Cloudflare IP allowlist for CF-Connecting-IP validation
// Only trust CF-Connecting-IP header when REMOTE_ADDR is actually a Cloudflare edge IP.
// Ranges source: https://www.cloudflare.com/ips/ (snapshot)

if (!function_exists('aurel_cf_ranges')) {
    function aurel_cf_ranges() {
        return [
            'v4' => [
                '173.245.48.0/20',
                '103.21.244.0/22',
                '103.22.200.0/22',
                '103.31.4.0/22',
                '141.101.64.0/18',
                '108.162.192.0/18',
                '190.93.240.0/20',
                '188.114.96.0/20',
                '197.234.240.0/22',
                '198.41.128.0/17',
                '162.158.0.0/15',
                '104.16.0.0/13',
                '104.24.0.0/14',
                '172.64.0.0/13',
                '131.0.72.0/22',
            ],
            'v6' => [
                '2400:cb00::/32',
                '2606:4700::/32',
                '2803:f800::/32',
                '2405:b500::/32',
                '2405:8100::/32',
                '2a06:98c0::/29',
                '2c0f:f248::/32',
            ],
        ];
    }
}

if (!function_exists('aurel_ipv4_in_cidr')) {
    function aurel_ipv4_in_cidr($ip, $cidr) {
        list($subnet, $mask) = explode('/', $cidr);
        $ipLong = ip2long($ip);
        $subnetLong = ip2long($subnet);
        if ($ipLong === false || $subnetLong === false) return false;
        $maskLong = -1 << (32 - (int)$mask);
        return ($ipLong & $maskLong) === ($subnetLong & $maskLong);
    }
}

if (!function_exists('aurel_ipv6_in_cidr')) {
    function aurel_ipv6_in_cidr($ip, $cidr) {
        list($subnet, $mask) = explode('/', $cidr);
        $ipBin = @inet_pton($ip);
        $subnetBin = @inet_pton($subnet);
        if ($ipBin === false || $subnetBin === false) return false;
        $mask = (int)$mask;
        $bytes = intdiv($mask, 8);
        $bits = $mask % 8;
        if ($bytes > 0 && substr($ipBin, 0, $bytes) !== substr($subnetBin, 0, $bytes)) return false;
        if ($bits === 0) return true;
        $maskByte = (0xff << (8 - $bits)) & 0xff;
        return (ord($ipBin[$bytes]) & $maskByte) === (ord($subnetBin[$bytes]) & $maskByte);
    }
}

if (!function_exists('is_cloudflare_ip')) {
    function is_cloudflare_ip($ip) {
        if (empty($ip)) return false;
        $ranges = aurel_cf_ranges();
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            foreach ($ranges['v4'] as $cidr) {
                if (aurel_ipv4_in_cidr($ip, $cidr)) return true;
            }
            return false;
        }
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            foreach ($ranges['v6'] as $cidr) {
                if (aurel_ipv6_in_cidr($ip, $cidr)) return true;
            }
            return false;
        }
        return false;
    }
}

if (!function_exists('aurel_client_ip')) {
    // Returns the real client IP, trusting CF-Connecting-IP only if the direct
    // peer (REMOTE_ADDR) is actually a Cloudflare edge IP. Otherwise falls back
    // to REMOTE_ADDR. X-Forwarded-For is NOT trusted blindly.
    function aurel_client_ip() {
        $remote = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP']) && is_cloudflare_ip($remote)) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        return $remote ?: 'unknown';
    }
}
