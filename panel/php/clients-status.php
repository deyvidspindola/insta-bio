<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
platform_require_auth();
header('Content-Type: application/json');

$input = platform_json_input();
$id = isset($input['id']) ? (int) $input['id'] : 0;
$status = isset($input['status']) ? (string) $input['status'] : '';

if ($id <= 0 || !in_array($status, ['active', 'suspended'], true)) {
  http_response_code(400);
  echo json_encode(['error' => 'Dados inválidos']);
  exit;
}

try {
  require __DIR__ . '/db.config.php';
  $pdo = platform_db();

  $find = $pdo->prepare('SELECT slug FROM clients WHERE id = ? LIMIT 1');
  $find->execute([$id]);
  $row = $find->fetch();
  if (!$row) {
    http_response_code(404);
    echo json_encode(['error' => 'Cliente não encontrado']);
    exit;
  }

  $stmt = $pdo->prepare('UPDATE clients SET status = ? WHERE id = ?');
  $stmt->execute([$status, $id]);

  sync_client_status(PLATFORM_ROOT, $row['slug'], $status);

  echo json_encode(['ok' => true, 'status' => $status]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
