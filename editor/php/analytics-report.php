<?php
/**
 * Proxy autenticado do editor → painel (summary | timeseries | clicks).
 * Rotas: api/analytics/summary|timeseries|clicks
 */
ini_set('display_errors', '0');
require __DIR__ . '/auth.config.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Método não permitido']);
  exit;
}

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'Não autenticado']);
  exit;
}

$report = trim((string) ($_GET['report'] ?? ''));
if (!in_array($report, ['summary', 'timeseries', 'clicks'], true)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Relatório inválido']);
  exit;
}

if (!function_exists('editor_load_license_config')) {
  require_once __DIR__ . '/platform-auth.php';
}

$config = editor_load_license_config();
if ($config === null || empty($config['slug']) || empty($config['token'])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Analytics indisponível: licença não configurada.']);
  exit;
}

$input = $_SERVER['REQUEST_METHOD'] === 'POST' ? [] : $_GET;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $raw = file_get_contents('php://input');
  $decoded = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
  if (is_array($decoded)) {
    $input = $decoded;
  }
}

$extra = [];
foreach (['from', 'to', 'grain', 'limit'] as $key) {
  if (isset($input[$key]) && $input[$key] !== '') {
    $extra[$key] = $input[$key];
  }
}

try {
  $url = editor_platform_api_url($config['api'], 'analytics/' . $report);
  $payload = editor_license_api_payload($extra);
  $result = editor_platform_post_json($url, $payload);

  $status = (int) ($result['http_status'] ?? 200);
  if (!isset($result['ok']) || $result['ok'] !== true) {
    if ($status < 400) {
      $status = 500;
    }
    http_response_code($status);
    echo json_encode([
      'ok' => false,
      'error' => $result['error'] ?? 'Falha ao consultar analytics',
    ]);
    exit;
  }

  unset($result['http_status']);
  echo json_encode($result);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Erro ao consultar analytics: ' . $e->getMessage()]);
}
