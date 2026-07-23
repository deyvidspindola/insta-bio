<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';
require __DIR__ . '/lib/analytics.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

try {
  $input = $_SERVER['REQUEST_METHOD'] === 'POST' ? platform_json_input() : $_GET;
  $slug = normalize_slug(platform_input_string($input['slug'] ?? '', 40));
  $token = platform_input_token($input['token'] ?? '');
  $deploy = normalize_slug(platform_input_string($input['deploy'] ?? '', 40));
  $host = normalize_license_host(platform_input_string($input['host'] ?? '', 255));

  if ($slug === '' || $token === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'slug e token são obrigatórios']);
    exit;
  }

  $pdo = platform_db();
  platform_ensure_license_column($pdo);
  platform_ensure_analytics_schema($pdo);

  $client = lookup_client_license($pdo, $slug, $token, $deploy, $host);
  if (!$client) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Licença inválida para esta instalação']);
    exit;
  }

  // Garante a chave de telemetria e devolve para o gate injetar na bio,
  // mesmo em clientes cujo license.config.php ainda não define ANALYTICS_KEY.
  $analyticsKey = ensure_client_analytics_key($pdo, $client);
  $analyticsUrl = analytics_track_url_from_license_api(
    (defined('LICENSE_API') && LICENSE_API !== '')
      ? (string) LICENSE_API
      : ((string) ($_SERVER['REQUEST_SCHEME'] ?? 'https') . '://'
        . (string) ($_SERVER['HTTP_HOST'] ?? '') . '/panel/api/license/check'),
  );

  echo json_encode([
    'ok' => true,
    'active' => $client['status'] === 'active',
    'status' => $client['status'],
    'slug' => $client['slug'],
    'analytics_key' => $analyticsKey,
    'analytics_url' => $analyticsUrl,
  ]);
} catch (InvalidArgumentException $e) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Erro ao verificar licença']);
}
