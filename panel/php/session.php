<?php
require __DIR__ . '/bootstrap.php';
platform_session_start();
header('Content-Type: application/json');

echo json_encode([
  'authenticated' => !empty($_SESSION['platform_admin_id']),
  'user' => $_SESSION['platform_admin_email'] ?? null,
]);
