<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
platform_require_auth();
header('Content-Type: application/json');

try {
  $input = platform_json_input();
  $id = platform_input_id($input['id'] ?? 0);

  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID inválido']);
    exit;
  }

  platform_load_config();
  $pdo = platform_db();

  $stmt = platform_db_execute($pdo, 'SELECT slug FROM clients WHERE id = ? LIMIT 1', [$id]);
  $client = $stmt->fetch();

  if (!$client) {
    http_response_code(404);
    echo json_encode(['error' => 'Cliente não encontrado']);
    exit;
  }

  $clientDir = rtrim(PLATFORM_ROOT, '/\\') . DIRECTORY_SEPARATOR . $client['slug'];
  remove_directory($clientDir);

  platform_db_execute($pdo, 'DELETE FROM clients WHERE id = ?', [$id]);

  echo json_encode(['ok' => true]);
} catch (InvalidArgumentException $e) {
  http_response_code(400);
  echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
