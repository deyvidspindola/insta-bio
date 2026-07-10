<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$input = $_SERVER['REQUEST_METHOD'] === 'POST' ? platform_json_input() : $_GET;
$slug = normalize_slug((string) ($input['slug'] ?? ''));
$token = trim((string) ($input['token'] ?? ''));
$deploy = normalize_slug((string) ($input['deploy'] ?? ''));
$host = normalize_license_host((string) ($input['host'] ?? ''));

if ($slug === '' || $token === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'slug e token são obrigatórios']);
  exit;
}

try {
  $pdo = platform_db();
  platform_ensure_license_column($pdo);

  $client = lookup_client_license($pdo, $slug, $token, $deploy, $host);
  if (!$client) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Licença inválida para esta instalação']);
    exit;
  }

  echo json_encode([
    'ok' => true,
    'active' => $client['status'] === 'active',
    'status' => $client['status'],
    'slug' => $client['slug'],
  ]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Erro ao verificar licença']);
}
