<?php
/**
 * POST /panel/api/clients/sync-template
 *
 * Propaga o ZIP de updates (panel/data/updates/) para todos os clientes.
 * Mesma fonte do apply remoto no editor.
 */
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
platform_require_auth();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Método não permitido']);
  exit;
}

try {
  platform_load_config();
  $pdo = platform_db();

  $result = sync_all_clients_from_template($pdo, PLATFORM_ROOT, TEMPLATE_DIR);
  echo json_encode($result);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
