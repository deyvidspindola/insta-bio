<?php
require __DIR__ . '/auth.config.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$username = isset($input['username']) ? (string) $input['username'] : '';
$password = isset($input['password']) ? (string) $input['password'] : '';

if ($username === AUTH_USERNAME && password_verify($password, AUTH_PASSWORD_HASH)) {
  session_regenerate_id(true);
  $_SESSION['user'] = $username;
  echo json_encode(['ok' => true, 'user' => $username]);
} else {
  http_response_code(401);
  echo json_encode(['error' => 'Usuário ou senha inválidos']);
}
