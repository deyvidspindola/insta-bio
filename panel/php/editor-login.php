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

try {
  $input = editor_auth_json_input();
  $slug = normalize_slug(platform_input_string($input['slug'] ?? '', 40));
  $token = platform_input_token($input['token'] ?? '');
  $email = platform_input_optional_email($input['email'] ?? $input['username'] ?? '');
  $password = (string) ($input['password'] ?? '');

  if ($slug === '' || $token === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'slug, token, e-mail e senha são obrigatórios']);
    exit;
  }

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
} catch (InvalidArgumentException $e) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Erro ao autenticar']);
}
