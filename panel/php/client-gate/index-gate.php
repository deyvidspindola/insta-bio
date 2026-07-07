<?php
require __DIR__ . '/client-license.php';
require_once __DIR__ . '/bio-share-meta.php';

require_client_license_active();

$index = __DIR__ . '/index.html';
if (!is_file($index)) {
  http_response_code(500);
  echo 'Bio não encontrada.';
  exit;
}

header('Content-Type: text/html; charset=utf-8');
echo bio_share_render_index(__DIR__, $index);
