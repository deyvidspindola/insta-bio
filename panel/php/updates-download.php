<?php
/**
 * GET /panel/api/updates/download?file=&expires=&signature=
 *
 * Stream do ZIP com URL assinada (HMAC + expiração).
 * Não exige sessão do painel — a assinatura é a autenticação.
 */

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/updates.php';

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok' => false, 'error' => 'Método não permitido']);
  exit;
}

try {
  $file = platform_input_string($_GET['file'] ?? '', 120);
  $expires = (int) ($_GET['expires'] ?? 0);
  $signature = strtolower(platform_input_string($_GET['signature'] ?? '', 64));

  $safeName = platform_updates_safe_zip_name($file);
  if ($safeName === null || $expires <= 0 || $signature === '') {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Parâmetros de download inválidos.']);
    exit;
  }

  if (!platform_verify_update_download($safeName, $expires, $signature)) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Link de download inválido ou expirado.']);
    exit;
  }

  $zipPath = platform_updates_dir() . DIRECTORY_SEPARATOR . $safeName;
  if (!is_file($zipPath)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Pacote não encontrado.']);
    exit;
  }

  @set_time_limit(0);
  @ini_set('memory_limit', '256M');

  $size = filesize($zipPath);
  header('Content-Type: application/zip');
  header('Content-Disposition: attachment; filename="' . $safeName . '"');
  if ($size !== false) {
    header('Content-Length: ' . $size);
  }
  header('X-Content-Type-Options: nosniff');

  $fh = fopen($zipPath, 'rb');
  if ($fh === false) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Falha ao abrir o pacote.']);
    exit;
  }

  while (!feof($fh)) {
    $chunk = fread($fh, 1024 * 256);
    if ($chunk === false) {
      break;
    }
    echo $chunk;
    if (function_exists('flush')) {
      flush();
    }
  }
  fclose($fh);
  exit;
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok' => false, 'error' => 'Erro ao baixar pacote']);
}
