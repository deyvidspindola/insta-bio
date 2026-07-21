<?php
require __DIR__ . '/bootstrap.php';
platform_session_start();
header('Content-Type: application/json');

try {
  $input = platform_json_input();
  $email = platform_input_optional_email($input['email'] ?? '');
  $password = (string) ($input['password'] ?? '');

  if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'E-mail e senha são obrigatórios']);
    exit;
  }

  $pdo = platform_db();
  $stmt = platform_db_execute(
    $pdo,
    'SELECT id, email, password_hash FROM platform_admins WHERE email = ? LIMIT 1',
    [$email],
  );
  $admin = $stmt->fetch();

  if (!$admin || !password_verify($password, $admin['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error' => 'E-mail ou senha inválidos']);
    exit;
  }

  session_regenerate_id(true);
  $_SESSION['platform_admin_id'] = (int) $admin['id'];
  $_SESSION['platform_admin_email'] = $admin['email'];

  echo json_encode(['ok' => true, 'user' => $admin['email']]);
} catch (InvalidArgumentException $e) {
  http_response_code(400);
  echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => 'Erro no servidor: ' . $e->getMessage()]);
}
