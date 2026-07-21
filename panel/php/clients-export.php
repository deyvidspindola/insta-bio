<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';
platform_require_auth();

$id = platform_input_id($_GET['id'] ?? 0);
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

  $stmt = platform_db_execute($pdo, 'SELECT * FROM clients WHERE id = ? LIMIT 1', [$id]);
  $client = $stmt->fetch();
  if (!$client) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Cliente não encontrado']);
    exit;
  }

  sync_client_license_files($pdo, PLATFORM_ROOT, $client);

  require_once __DIR__ . '/lib/analytics.php';
  ensure_client_analytics_key($pdo, $client);

  if (empty($client['self_hosted'])) {
    throw new RuntimeException(
      'Este cliente está configurado só na plataforma. Ative "Hospedagem própria" para exportar o ZIP.',
    );
  }

  $slug = $client['slug'];
  $allowedHost = normalize_license_host((string) ($client['allowed_host'] ?? ''));
  $deployPath = normalize_deploy_path((string) ($client['deploy_path'] ?? ''));
  if ($allowedHost === '') {
    throw new RuntimeException('Configure o domínio autorizado do cliente antes de exportar o ZIP.');
  }
  if ($client['deploy_path'] === null) {
    throw new RuntimeException('Configure a pasta no domínio antes de exportar o ZIP.');
  }

  $clientDir = rtrim(PLATFORM_ROOT, '/\\') . DIRECTORY_SEPARATOR . $slug;
  if (!is_dir($clientDir)) {
    throw new RuntimeException('Pasta do cliente não encontrada');
  }

  $exportBio = client_resolve_export_bio($clientDir);

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

  $skipNames = ['.license-cache.json', '.suspended', '.probe-write', 'bio.draft.json'];
  $editorHtaccessPath = __DIR__ . '/../../deploy/apache/editor.htaccess';
  $iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($clientDir, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST,
  );

  foreach ($iterator as $item) {
    $relative = $iterator->getSubPathName();
    $basename = basename($relative);
    $relativePath = str_replace('\\', '/', $relative);
    if (in_array($basename, $skipNames, true)) {
      continue;
    }
    if ($basename === '.htaccess' && !str_starts_with($relativePath, 'editor/')) {
      continue;
    }

    if ($item->isDir()) {
      $zip->addEmptyDir($relativePath);
      continue;
    }

    if ($basename === 'license.config.php') {
      $zip->addFromString(
        $relativePath,
        build_client_license_config_content(
          normalize_slug((string) $client['slug']),
          (string) $client['license_token'],
          platform_public_base_url(),
          true,
          $allowedHost,
          $deployPath,
          (string) ($client['analytics_key'] ?? ''),
        ),
      );
      continue;
    }

    if ($basename === 'platform-api.json' && str_starts_with($relativePath, 'editor/')) {
      $zip->addFromString(
        $relativePath,
        editor_platform_api_json_content(
          normalize_slug((string) $client['slug']),
          (string) $client['license_token'],
          platform_public_base_url(),
        ),
      );
      continue;
    }

    if ($basename === 'bio.json') {
      $zip->addFromString($relativePath, $exportBio['content']);
      continue;
    }

    if ($basename === 'auth.config.php') {
      $zip->addFromString($relativePath, editor_paths_config_content());
      continue;
    }

    $zip->addFile($item->getPathname(), $relativePath);
  }

  if (is_file($editorHtaccessPath)) {
    $zip->addFromString('editor/.htaccess', (string) file_get_contents($editorHtaccessPath));
  }

  $bioJsonPhp = __DIR__ . '/client-gate/bio-json.php';
  if (is_file($bioJsonPhp)) {
    $zip->addFromString('bio-json.php', (string) file_get_contents($bioJsonPhp));
  }

  $authFile = $clientDir . DIRECTORY_SEPARATOR . 'editor' . DIRECTORY_SEPARATOR . 'auth.config.php';
  if (is_file($authFile)) {
    require_once __DIR__ . '/lib/bio-path.php';
    $bioPath = platform_parse_auth_bio_json_path($authFile);
    if ($bioPath !== null) {
      $relativePath = bio_path_to_relative($bioPath, $clientDir);
      $zip->addFromString(
        'bio-path.json',
        json_encode(
          ['bioJsonPath' => $relativePath, 'updatedAt' => date('c')],
          JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT,
        ) . "\n",
      );
    }
  }

  $readme = client_export_readme(
    $slug,
    platform_public_base_url(),
    $allowedHost,
    $deployPath,
    $exportBio['source'],
  );
  $zip->addFromString('LEIA-ME.txt', $readme);
  $zip->addFromString('.htaccess', client_selfhost_htaccess());

  $verifyPhp = __DIR__ . '/client-gate/verificar-ambiente.php';
  if (is_file($verifyPhp)) {
    $zip->addFromString('verificar-ambiente.php', (string) file_get_contents($verifyPhp));
  }

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
