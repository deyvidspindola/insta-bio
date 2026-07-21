<?php
require __DIR__ . '/platform-auth.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$email = isset($input['email']) ? strtolower(trim((string) $input['email'])) : '';
$nonce = isset($input['nonce']) ? trim((string) $input['nonce']) : '';
$sig = isset($input['sig']) ? trim((string) $input['sig']) : '';

if ($email === '' || $nonce === '' || $sig === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Dados de autenticação incompletos']);
  exit;
}

if (!editor_verify_auth_handshake($email, $nonce, $sig)) {
  http_response_code(401);
  echo json_encode(['error' => 'Autenticação remota inválida']);
  exit;
}

session_regenerate_id(true);
$_SESSION['user'] = $email;
echo json_encode(['ok' => true, 'user' => $email]);
