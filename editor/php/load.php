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

$payload = bio_load_for_editor();
if ($payload['config'] === null) {
  http_response_code(404);
  echo json_encode(['error' => 'Nenhuma configuração encontrada']);
  exit;
}

echo json_encode([
  'ok' => true,
  'config' => $payload['config'],
  'source' => $payload['source'],
  'hasDraft' => $payload['hasDraft'],
]);
