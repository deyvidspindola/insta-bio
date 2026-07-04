<?php
require __DIR__ . '/auth.config.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Não autenticado']);
  exit;
}

$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
$files = [];

if (is_dir(ASSETS_DIR)) {
  foreach (scandir(ASSETS_DIR) as $name) {
    if ($name === '.' || $name === '..') continue;
    $full = ASSETS_DIR . '/' . $name;
    if (!is_file($full)) continue;
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed, true)) continue;
    $files[] = [
      'name' => $name,
      'path' => 'assets/' . $name,
      'size' => filesize($full),
      'modified' => filemtime($full),
    ];
  }
}

usort($files, fn($a, $b) => $b['modified'] <=> $a['modified']);

echo json_encode(['files' => $files]);
