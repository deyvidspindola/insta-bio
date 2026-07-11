<?php
/**
 * POST /panel/api/updates/package
 *
 * Autenticado por slug + license_token.
 * Devolve URL assinada (TTL curto) + sha256 + version para o apply do editor.
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
    : null;
  if ($pkg === null) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Pacote da última versão não disponível.']);
    exit;
  }

  $zipPath = platform_resolve_package_zip($pkg);
  if ($zipPath === null) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Arquivo ZIP não encontrado no servidor.']);
    exit;
  }

  $filename = basename($zipPath);
  $sha256 = (string) ($pkg['sha256'] ?? '');
  if ($sha256 === '' || !preg_match('/^[a-f0-9]{64}$/', $sha256)) {
    $sha256 = hash_file('sha256', $zipPath) ?: '';
  }
  if ($sha256 === '') {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Não foi possível calcular o checksum do pacote.']);
    exit;
  }

  $expires = time() + platform_updates_download_ttl();
  $signature = platform_sign_update_download($filename, $expires);
  $signedUrl = platform_update_download_public_url($filename, $expires, $signature);

  echo json_encode([
    'ok' => true,
    'url' => $signedUrl,
    'sha256' => $sha256,
    'version' => $latest,
    'size' => (int) ($pkg['size'] ?? filesize($zipPath)),
    'expiresAt' => gmdate('c', $expires),
    'slug' => $client['slug'],
  ]);
} catch (InvalidArgumentException $e) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Erro ao obter pacote de atualização']);
}
