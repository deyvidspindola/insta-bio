<?php
require __DIR__ . '/bootstrap.php';
platform_session_start();
header('Content-Type: application/json');

$input = platform_json_input();
$email = isset($input['email']) ? strtolower(trim((string) $input['email'])) : '';
$password = isset($input['password']) ? (string) $input['password'] : '';

if ($email === '' || $password === '') {
  http_response_code(400);
  echo json_encode(['error' => 'E-mail e senha são obrigatórios']);
  exit;
}

try {
  $pdo = platform_db();
  $stmt = $pdo->prepare('SELECT id, email, password_hash FROM platform_admins WHERE email = ? LIMIT 1');
  $stmt->execute([$email]);
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
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => 'Erro no servidor: ' . $e->getMessage()]);
}
