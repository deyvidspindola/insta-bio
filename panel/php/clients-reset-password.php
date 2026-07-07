<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
platform_require_auth();
header('Content-Type: application/json');

$input = platform_json_input();
$id = isset($input['id']) ? (int) $input['id'] : 0;
$providedPassword = isset($input['password']) ? trim((string) $input['password']) : '';

if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'ID inválido']);
  exit;
}

if ($providedPassword !== '' && strlen($providedPassword) < 6) {
  http_response_code(400);
  echo json_encode(['error' => 'A senha deve ter pelo menos 6 caracteres']);
  exit;
}

try {
  platform_load_config();
  $pdo = platform_db();

  $stmt = $pdo->prepare('SELECT slug, email FROM clients WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
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

  $update = $pdo->prepare('UPDATE clients SET password_hash = ?, password_enc = ? WHERE id = ?');
  $update->execute([$passwordHash, $passwordEnc, $id]);

  echo json_encode(['ok' => true, 'password' => $plainPassword]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
