<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
platform_require_auth();
header('Content-Type: application/json');

$input = platform_json_input();
$id = isset($input['id']) ? (int) $input['id'] : 0;

if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'ID inválido']);
  exit;
}

try {
  platform_load_config();
  $pdo = platform_db();

  $stmt = $pdo->prepare('SELECT slug FROM clients WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
  $client = $stmt->fetch();

  if (!$client) {
    http_response_code(404);
    echo json_encode(['error' => 'Cliente não encontrado']);
    exit;
  }

  $clientDir = rtrim(PLATFORM_ROOT, '/\\') . DIRECTORY_SEPARATOR . $client['slug'];
  remove_directory($clientDir);

  $delete = $pdo->prepare('DELETE FROM clients WHERE id = ?');
  $delete->execute([$id]);

  echo json_encode(['ok' => true]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
