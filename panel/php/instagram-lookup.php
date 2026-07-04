<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/instagram.php';
platform_require_auth();
header('Content-Type: application/json');

$input = platform_json_input();
$handle = isset($input['handle']) ? trim((string) $input['handle']) : '';

if ($handle === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Informe o @ do Instagram']);
  exit;
}

try {
  $profile = fetch_instagram_profile($handle);
  echo json_encode(['ok' => true, 'profile' => $profile]);
} catch (InvalidArgumentException $e) {
  http_response_code(400);
  echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
  http_response_code(502);
  echo json_encode(['error' => $e->getMessage()]);
}
