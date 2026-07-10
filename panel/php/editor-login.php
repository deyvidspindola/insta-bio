<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/editor-auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
editor_auth_cors_headers();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Método não permitido']);
  exit;
}

$input = editor_auth_json_input();
$slug = normalize_slug((string) ($input['slug'] ?? ''));
$token = trim((string) ($input['token'] ?? ''));
$email = strtolower(trim((string) ($input['email'] ?? $input['username'] ?? '')));
$password = (string) ($input['password'] ?? '');

if ($slug === '' || $token === '' || $email === '' || $password === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'slug, token, e-mail e senha são obrigatórios']);
  exit;
}

try {
  $pdo = platform_db();
  $client = lookup_client_editor_credentials($pdo, $slug, $token, $email, $password);
  if (!$client) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'E-mail ou senha inválidos']);
    exit;
  }

  echo json_encode([
    'ok' => true,
    'user' => $client['email'],
    'slug' => $client['slug'],
    ...editor_auth_handshake($token, (string) $client['email'], (string) $client['slug']),
  ]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Erro ao autenticar']);
}
