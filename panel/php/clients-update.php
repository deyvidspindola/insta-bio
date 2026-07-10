<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';
platform_require_auth();
header('Content-Type: application/json');

try {
  $input = platform_json_input();
  $id = platform_input_id($input['id'] ?? 0);
  $name = platform_input_name($input['name'] ?? '');
  $email = platform_input_email($input['email'] ?? '');
  $slug = platform_input_string($input['slug'] ?? '', 40);
  $selfHosted = platform_input_bool($input['self_hosted'] ?? false);
  $allowedHost = platform_input_host($input['allowed_host'] ?? '');
  $deployPath = platform_input_deploy_path($input['deploy_path'] ?? '');

  if ($id <= 0 || $slug === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Campos obrigatórios']);
    exit;
  }

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
