<?php
require __DIR__ . '/auth.config.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Não autenticado']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if ($data === null) {
  http_response_code(400);
  echo json_encode(['error' => 'JSON inválido']);
  exit;
}

$pretty = json_encode(
  $data,
  JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
);

if (file_put_contents(BIO_JSON_PATH, $pretty . "\n") === false) {
  http_response_code(500);
  echo json_encode(['error' => 'Não foi possível salvar o bio.json (verifique permissões)']);
  exit;
}

echo json_encode(['ok' => true]);
