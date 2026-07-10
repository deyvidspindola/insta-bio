<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';
platform_require_auth();
header('Content-Type: application/json');

$input = platform_json_input();
$id = isset($input['id']) ? (int) $input['id'] : 0;
$name = isset($input['name']) ? trim((string) $input['name']) : '';
$email = isset($input['email']) ? trim((string) $input['email']) : '';
$slug = isset($input['slug']) ? trim((string) $input['slug']) : '';
$selfHosted = !empty($input['self_hosted']);
$allowedHost = isset($input['allowed_host']) ? trim((string) $input['allowed_host']) : '';
$deployPath = isset($input['deploy_path']) ? trim((string) $input['deploy_path']) : '';

if ($id <= 0 || $name === '' || $email === '' || $slug === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Campos obrigatórios']);
  exit;
}

try {
  platform_load_config();
  $pdo = platform_db();

  $client = update_client(
    $pdo,
    PLATFORM_ROOT,
    $id,
    $name,
    $email,
    $slug,
    $selfHosted,
    $allowedHost,
    $deployPath,
  );

  echo json_encode(['ok' => true, 'client' => $client]);
} catch (InvalidArgumentException $e) {
  platform_capture_exception($e);
  http_response_code(400);
  echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
