<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
platform_require_auth();
header('Content-Type: application/json');

$input = platform_json_input();
$id = isset($input['id']) ? (int) $input['id'] : 0;
$name = isset($input['name']) ? trim((string) $input['name']) : '';
$email = isset($input['email']) ? trim((string) $input['email']) : '';
$slug = isset($input['slug']) ? trim((string) $input['slug']) : '';

if ($id <= 0 || $name === '' || $email === '' || $slug === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Campos obrigatórios']);
  exit;
}

try {
  require __DIR__ . '/db.config.php';
  $pdo = platform_db();

  $client = update_client($pdo, PLATFORM_ROOT, $id, $name, $email, $slug);

  echo json_encode(['ok' => true, 'client' => $client]);
} catch (InvalidArgumentException $e) {
  http_response_code(400);
  echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
