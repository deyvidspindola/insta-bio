<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';
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
  platform_load_config();
  $pdo = platform_db();

  $find = $pdo->prepare('SELECT * FROM clients WHERE id = ? LIMIT 1');
  $find->execute([$id]);
  $row = $find->fetch();
  if (!$row) {
    http_response_code(404);
    echo json_encode(['error' => 'Cliente não encontrado']);
    exit;
  }

  $stmt = $pdo->prepare('UPDATE clients SET status = ? WHERE id = ?');
  $stmt->execute([$status, $id]);
  $row['status'] = $status;

  sync_client_status(PLATFORM_ROOT, $row['slug'], $status);
  sync_client_license_files($pdo, PLATFORM_ROOT, $row);

  $cacheFile = rtrim(PLATFORM_ROOT, '/\\') . DIRECTORY_SEPARATOR . $row['slug'] . DIRECTORY_SEPARATOR . '.license-cache.json';
  if (file_exists($cacheFile)) {
    unlink($cacheFile);
  }

  echo json_encode(['ok' => true, 'status' => $status]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
