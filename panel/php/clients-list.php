<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/license.php';
platform_require_auth();
header('Content-Type: application/json');

try {
  $pdo = platform_db();
  platform_ensure_license_column($pdo);
  $stmt = $pdo->query(
    'SELECT id, slug, name, email, status, self_hosted, allowed_host, deploy_path, created_at, updated_at FROM clients ORDER BY created_at DESC',
  );
  $clients = $stmt->fetchAll();
  foreach ($clients as &$client) {
    $client['self_hosted'] = (bool) ($client['self_hosted'] ?? false);
  }
  unset($client);

  echo json_encode(['clients' => $clients]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
