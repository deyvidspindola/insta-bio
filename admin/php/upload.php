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

$input = json_decode(file_get_contents('php://input'), true);
$name = isset($input['name']) ? (string) $input['name'] : 'imagem.png';
$data = isset($input['data']) ? (string) $input['data'] : '';

if (strpos($data, ',') !== false) {
  $data = explode(',', $data, 2)[1];
}

$bytes = base64_decode($data, true);
if ($bytes === false || $bytes === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Arquivo inválido']);
  exit;
}

$maxBytes = 25 * 1024 * 1024;
if (strlen($bytes) > $maxBytes) {
  http_response_code(400);
  echo json_encode(['error' => 'Arquivo muito grande (máximo 25 MB)']);
  exit;
}

// Sanitiza o nome do arquivo (sem acentos, minúsculo, seguro).
$ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
$ext = preg_replace('/[^a-z0-9]/', '', $ext);
$allowed = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov'];
if ($ext === '' || !in_array($ext, $allowed, true)) {
  $ext = 'png';
}

$base = strtolower(pathinfo($name, PATHINFO_FILENAME));
$base = iconv('UTF-8', 'ASCII//TRANSLIT', $base);
$base = preg_replace('/[^a-z0-9]+/', '-', $base);
$base = trim($base, '-');
$base = substr($base, 0, 60);
if ($base === '') {
  $base = 'imagem';
}

if (!is_dir(ASSETS_DIR)) {
  mkdir(ASSETS_DIR, 0755, true);
}

$filename = $base . '.' . $ext;
$counter = 1;
while (file_exists(ASSETS_DIR . '/' . $filename)) {
  $filename = $base . '-' . $counter . '.' . $ext;
  $counter++;
}

if (file_put_contents(ASSETS_DIR . '/' . $filename, $bytes) === false) {
  http_response_code(500);
  echo json_encode(['error' => 'Não foi possível salvar a imagem (verifique permissões)']);
  exit;
}

echo json_encode(['path' => 'assets/' . $filename]);
