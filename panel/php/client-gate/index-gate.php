<?php
require __DIR__ . '/client-license.php';

// Tracking via rewrite → index.php (não depende de analytics-track.php no disco).
if (isset($_GET['__ib_analytics_track'])) {
  ini_set('display_errors', '0');
  client_analytics_proxy_run();
  exit;
}

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
