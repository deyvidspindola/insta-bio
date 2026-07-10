<?php
require __DIR__ . '/auth.config.php';
require __DIR__ . '/platform-auth.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$username = isset($input['username']) ? strtolower(trim((string) $input['username'])) : '';
$password = isset($input['password']) ? (string) $input['password'] : '';

if ($username === '' || $password === '') {
  http_response_code(400);
  echo json_encode(['error' => 'E-mail e senha são obrigatórios']);
  exit;
}

$authenticatedUser = null;

if (editor_load_license_config() !== null) {
  $result = editor_platform_login($username, $password);
  if (!empty($result['ok'])) {
    $authenticatedUser = (string) ($result['user'] ?? $username);
  } else {
    http_response_code(401);
    echo json_encode(['error' => $result['error'] ?? 'E-mail ou senha inválidos']);
    exit;
  }
} elseif (editor_legacy_local_login($username, $password)) {
  $authenticatedUser = $username;
} else {
  http_response_code(401);
  echo json_encode(['error' => 'E-mail ou senha inválidos']);
  exit;
}

session_regenerate_id(true);
$_SESSION['user'] = $authenticatedUser;
echo json_encode(['ok' => true, 'user' => $authenticatedUser]);
