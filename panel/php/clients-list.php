<?php
require __DIR__ . '/bootstrap.php';
platform_require_auth();
header('Content-Type: application/json');

try {
  $pdo = platform_db();
  $stmt = $pdo->query(
    'SELECT id, slug, name, email, status, created_at, updated_at FROM clients ORDER BY created_at DESC',
  );
  $clients = $stmt->fetchAll();

  echo json_encode(['clients' => $clients]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
