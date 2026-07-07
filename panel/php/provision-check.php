<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
platform_require_auth();
header('Content-Type: application/json');

try {
  platform_load_config();
  echo json_encode(platform_provision_check(PLATFORM_ROOT, TEMPLATE_DIR));
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
