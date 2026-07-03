<?php
require __DIR__ . '/auth.config.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Não autenticado']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$name = isset($input['name']) ? basename((string) $input['name']) : '';

if (!preg_match('/^[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|gif|webp|svg)$/i', $name)) {
  http_response_code(400);
  echo json_encode(['error' => 'Nome de arquivo inválido']);
  exit;
}

$full = ASSETS_DIR . '/' . $name;
if (!is_file($full)) {
  http_response_code(404);
  echo json_encode(['error' => 'Arquivo não encontrado']);
  exit;
}

if (file_exists(BIO_JSON_PATH)) {
  $json = file_get_contents(BIO_JSON_PATH);
  $needles = [$name, 'assets/' . $name, '/assets/' . $name];
  foreach ($needles as $needle) {
    if (strpos($json, $needle) !== false) {
      http_response_code(409);
      echo json_encode(['error' => 'Imagem em uso na bio. Remova das seções antes de excluir.']);
      exit;
    }
  }
}

if (!unlink($full)) {
  http_response_code(500);
  echo json_encode(['error' => 'Não foi possível excluir (verifique permissões)']);
  exit;
}

echo json_encode(['ok' => true]);
