<?php
/**
 * Restaura a bio pública e o rascunho a partir de bio.json.bak
 * (versão publicada imediatamente anterior à última publicação).
 */
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

if (!bio_has_backup()) {
  http_response_code(404);
  echo json_encode(['error' => 'Nenhum backup encontrado. O backup é criado ao publicar.']);
  exit;
}

$restored = bio_restore_backup();
if ($restored === null) {
  http_response_code(500);
  echo json_encode(['error' => 'Não foi possível restaurar o backup (verifique permissões)']);
  exit;
}

echo json_encode(['ok' => true, 'config' => $restored]);
