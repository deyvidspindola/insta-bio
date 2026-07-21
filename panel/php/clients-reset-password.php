<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
platform_require_auth();
header('Content-Type: application/json');

try {
  $input = platform_json_input();
  $id = platform_input_id($input['id'] ?? 0);
  $providedPassword = platform_input_password($input['password'] ?? '');

  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID inválido']);
    exit;
  }

  platform_load_config();
  $pdo = platform_db();

  $stmt = platform_db_execute(
    $pdo,
    'SELECT slug, email FROM clients WHERE id = ? LIMIT 1',
    [$id],
  );
  $client = $stmt->fetch();

  if (!$client) {
    http_response_code(404);
    echo json_encode(['error' => 'Cliente não encontrado']);
    exit;
  }

  $plainPassword = $providedPassword !== '' ? $providedPassword : generate_password(12);
  $passwordHash = password_hash($plainPassword, PASSWORD_BCRYPT);
  $passwordEnc = app_encrypt($plainPassword);

  update_client_password(PLATFORM_ROOT, $client['slug'], $client['email'], $passwordHash);

  platform_db_execute(
    $pdo,
    'UPDATE clients SET password_hash = ?, password_enc = ? WHERE id = ?',
    [$passwordHash, $passwordEnc, $id],
  );

  echo json_encode(['ok' => true, 'password' => $plainPassword]);
} catch (InvalidArgumentException $e) {
  http_response_code(400);
  echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
