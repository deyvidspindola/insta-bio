<?php
require __DIR__ . '/auth.config.php';
require __DIR__ . '/client-guard.php';
require __DIR__ . '/bio-storage.php';
require_client_active();
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Não autenticado']);
  exit;
}

$published = bio_read_json(bio_published_path());
if ($published === null) {
  http_response_code(404);
  echo json_encode(['error' => 'Bio publicada não encontrada']);
  exit;
}

if (!bio_write_json(bio_draft_path(), $published)) {
  http_response_code(500);
  echo json_encode(['error' => 'Não foi possível reverter o rascunho (verifique permissões)']);
  exit;
}

echo json_encode(['ok' => true, 'config' => $published]);
