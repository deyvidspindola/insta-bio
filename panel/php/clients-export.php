<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';
platform_require_auth();

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($id <= 0) {
  http_response_code(400);
  header('Content-Type: application/json');
  echo json_encode(['error' => 'ID inválido']);
  exit;
}

if (!class_exists('ZipArchive')) {
  http_response_code(500);
  header('Content-Type: application/json');
  echo json_encode(['error' => 'ZipArchive não disponível neste servidor']);
  exit;
}

try {
  platform_load_config();
  $pdo = platform_db();
  platform_ensure_license_column($pdo);

  $stmt = $pdo->prepare('SELECT * FROM clients WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
  $client = $stmt->fetch();
  if (!$client) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Cliente não encontrado']);
    exit;
  }

  sync_client_license_files($pdo, PLATFORM_ROOT, $client);
  $slug = $client['slug'];
  $clientDir = rtrim(PLATFORM_ROOT, '/\\') . DIRECTORY_SEPARATOR . $slug;
  if (!is_dir($clientDir)) {
    throw new RuntimeException('Pasta do cliente não encontrada');
  }

  $tmp = tempnam(sys_get_temp_dir(), 'biozip-');
  if ($tmp === false) {
    throw new RuntimeException('Não foi possível criar arquivo temporário');
  }
  $zipPath = $tmp . '.zip';
  rename($tmp, $zipPath);

  $zip = new ZipArchive();
  if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    throw new RuntimeException('Não foi possível criar o ZIP');
  }

  $skipNames = ['.license-cache.json', '.suspended', '.probe-write'];
  $iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($clientDir, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST,
  );

  foreach ($iterator as $item) {
    $relative = $iterator->getSubPathName();
    $basename = basename($relative);
    if (in_array($basename, $skipNames, true) || $basename === '.htaccess') {
      continue;
    }

    if ($item->isDir()) {
      $zip->addEmptyDir(str_replace('\\', '/', $relative));
      continue;
    }

    if ($basename === 'license.config.php') {
      $licenseContent = (string) file_get_contents($item->getPathname());
      $zip->addFromString(
        str_replace('\\', '/', $relative),
        license_config_for_selfhost_export($licenseContent),
      );
      continue;
    }

    $zip->addFile($item->getPathname(), str_replace('\\', '/', $relative));
  }

  $readme = client_export_readme($slug, platform_public_base_url());
  $zip->addFromString('LEIA-ME.txt', $readme);
  $zip->addFromString('.htaccess', client_selfhost_htaccess());

  $zip->close();

  $filename = 'bio-' . $slug . '.zip';
  header('Content-Type: application/zip');
  header('Content-Disposition: attachment; filename="' . $filename . '"');
  header('Content-Length: ' . (string) filesize($zipPath));
  header('Cache-Control: no-store');

  readfile($zipPath);
  unlink($zipPath);
} catch (Throwable $e) {
  platform_capture_exception($e);
  if (isset($zipPath) && file_exists($zipPath)) {
    unlink($zipPath);
  }
  http_response_code(500);
  header('Content-Type: application/json');
  echo json_encode(['error' => $e->getMessage()]);
}
