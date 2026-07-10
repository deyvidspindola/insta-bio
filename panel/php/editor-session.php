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

if ($slug === '' || $token === '' || $email === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'valid' => false, 'error' => 'slug, token e e-mail são obrigatórios']);
  exit;
}

try {
  $pdo = platform_db();
  $client = lookup_client_editor_credentials($pdo, $slug, $token, $email);
  if (!$client) {
    echo json_encode(['ok' => true, 'valid' => false]);
    exit;
  }

  echo json_encode([
    'ok' => true,
    'valid' => true,
    'user' => $client['email'],
    'slug' => $client['slug'],
  ]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['ok' => false, 'valid' => false, 'error' => 'Erro ao validar sessão']);
}
