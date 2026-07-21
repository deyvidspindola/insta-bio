<?php
/**
 * POST /panel/api/updates/check
 *
 * Autenticado por slug + license_token (igual license/check).
 * Só clientes active recebem metadados de versão.
 * NÃO serve o ZIP (Fase D) — só latest/changelog/comparação.
 */

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';
require __DIR__ . '/lib/updates.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Método não permitido']);
  exit;
}

try {
  $input = $_SERVER['REQUEST_METHOD'] === 'POST' ? platform_json_input() : $_GET;
  $slug = normalize_slug(platform_input_string($input['slug'] ?? '', 40));
  $token = platform_input_token($input['token'] ?? '');
  $deploy = normalize_slug(platform_input_string($input['deploy'] ?? '', 40));
  $host = normalize_license_host(platform_input_string($input['host'] ?? '', 255));
  $installed = platform_input_string($input['installed'] ?? '0.0.0', 32);
  if ($installed === '' || $installed === 'desconhecida') {
    $installed = '0.0.0';
  }

  if ($slug === '' || $token === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'slug e token são obrigatórios']);
    exit;
  }

  $pdo = platform_db();
  platform_ensure_license_column($pdo);

  $client = lookup_client_license($pdo, $slug, $token, $deploy, $host);
  if (!$client) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Licença inválida para esta instalação']);
    exit;
  }

  if (($client['status'] ?? '') !== 'active') {
    http_response_code(403);
    echo json_encode([
      'ok' => false,
      'error' => 'Conta suspensa. Atualizações indisponíveis.',
      'status' => $client['status'],
    ]);
    exit;
  }

  $manifest = platform_load_updates_manifest();
  if ($manifest === null) {
    http_response_code(503);
    echo json_encode([
      'ok' => false,
      'error' => platform_updates_catalog_missing_message(),
    ]);
    exit;
  }

  $latest = (string) ($manifest['latest'] ?? '');
  if ($latest === '') {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Nenhuma versão publicada ainda.']);
    exit;
  }

  $pkg = is_array($manifest['packages'][$latest] ?? null)
    ? $manifest['packages'][$latest]
    : [];

  $changelog = (string) ($pkg['changelog'] ?? $manifest['changelog'] ?? '');
  $releasedAt = (string) ($pkg['releasedAt'] ?? $manifest['releasedAt'] ?? '');

  $updateAvailable = version_compare($latest, $installed, '>');

  echo json_encode([
    'ok' => true,
    'updateAvailable' => $updateAvailable,
    'installed' => $installed,
    'latest' => $latest,
    'changelog' => $changelog !== '' ? $changelog : null,
    'releasedAt' => $releasedAt !== '' ? $releasedAt : null,
    'slug' => $client['slug'],
  ]);
} catch (InvalidArgumentException $e) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Erro ao verificar atualizações']);
}
