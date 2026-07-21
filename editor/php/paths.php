<?php
require __DIR__ . '/auth.config.php';
require __DIR__ . '/editor-paths.php';
require __DIR__ . '/bio-storage.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Não autenticado']);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  echo json_encode(['ok' => true, 'paths' => editor_read_paths_info()]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Método não permitido']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$bioInput = isset($input['bioJsonPath']) ? trim((string) $input['bioJsonPath']) : '';

$normalized = editor_normalize_bio_path_input($bioInput);
if (empty($normalized['ok'])) {
  http_response_code(400);
  echo json_encode(['error' => $normalized['error'] ?? 'Caminho inválido']);
  exit;
}

$assetsDir = isset($input['assetsDir']) && trim((string) $input['assetsDir']) !== ''
  ? trim((string) $input['assetsDir'])
  : (string) $normalized['assetsDir'];

if (!editor_write_paths_config((string) $normalized['path'], $assetsDir)) {
  http_response_code(500);
  echo json_encode(['error' => 'Não foi possível gravar auth.config.php (verifique permissões)']);
  exit;
}

  $bioPath = str_replace('\\', '/', (string) $normalized['path']);
  $assetsPath = str_replace('\\', '/', $assetsDir);
  $clientRoot = bio_path_client_root_from_editor();
  $publicBioUrl = bio_path_to_relative($bioPath, $clientRoot);

  echo json_encode([
    'ok' => true,
    'paths' => [
      'bioJsonPath' => $bioPath,
      'assetsDir' => $assetsPath,
      'draftPath' => dirname($bioPath) . '/bio.draft.json',
      'publicBioUrl' => $publicBioUrl,
      'configFile' => str_replace('\\', '/', editor_auth_config_file()),
      'bioExists' => is_file($bioPath),
      'draftExists' => is_file(dirname($bioPath) . '/bio.draft.json'),
      'writable' => is_dir(dirname($bioPath)) && is_writable(dirname($bioPath)),
    ],
    'reloadRequired' => true,
  ]);
