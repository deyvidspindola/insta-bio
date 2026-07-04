<?php

function platform_db(): PDO
{
  static $pdo = null;
  if ($pdo !== null) {
    return $pdo;
  }

  $configFile = __DIR__ . '/db.config.php';
  if (!file_exists($configFile)) {
    throw new RuntimeException('Configure panel/php/db.config.php antes de usar o painel.');
  }

  require $configFile;

  $pdo = new PDO(
    'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
    DB_USER,
    DB_PASS,
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ],
  );

  return $pdo;
}

function platform_session_start(): void
{
  if (session_status() === PHP_SESSION_ACTIVE) {
    return;
  }

  session_name('platform_session');
  session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/panel/',
    'httponly' => true,
    'samesite' => 'Strict',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
  ]);
  session_start();
}

function platform_require_auth(): void
{
  platform_session_start();
  if (empty($_SESSION['platform_admin_id'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Não autenticado']);
    exit;
  }
}

function platform_json_input(): array
{
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function app_encrypt(string $plain): string
{
  $key = hash('sha256', APP_SECRET, true);
  $iv = random_bytes(16);
  $cipher = openssl_encrypt($plain, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
  return base64_encode($iv . $cipher);
}

function app_decrypt(?string $enc): ?string
{
  if ($enc === null || $enc === '') {
    return null;
  }
  $raw = base64_decode($enc, true);
  if ($raw === false || strlen($raw) <= 16) {
    return null;
  }
  $key = hash('sha256', APP_SECRET, true);
  $iv = substr($raw, 0, 16);
  $cipher = substr($raw, 16);
  $plain = openssl_decrypt($cipher, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
  return $plain === false ? null : $plain;
}
