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

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if ($data === null || !is_array($data)) {
  http_response_code(400);
  echo json_encode(['error' => 'JSON inválido']);
  exit;
}

if (!bio_write_json(bio_draft_path(), $data)) {
  http_response_code(500);
  echo json_encode(['error' => 'Não foi possível salvar o rascunho (verifique permissões)']);
  exit;
}

echo json_encode(['ok' => true, 'saved' => 'draft']);
