<?php

$authConfig = __DIR__ . '/editor/auth.config.php';
if (!is_file($authConfig)) {
  http_response_code(404);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => 'Configuração do editor não encontrada']);
  exit;
}

require $authConfig;

if (!defined('BIO_JSON_PATH') || !is_file(BIO_JSON_PATH)) {
  http_response_code(404);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => 'bio.json não encontrado']);
  exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
readfile(BIO_JSON_PATH);
