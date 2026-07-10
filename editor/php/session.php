<?php
require __DIR__ . '/platform-auth.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
header('Content-Type: application/json');

$authenticated = isset($_SESSION['user']);
$user = $authenticated ? (string) $_SESSION['user'] : null;

if ($authenticated && $user !== null && editor_load_license_config() !== null && !editor_uses_remote_auth()) {
  $check = editor_platform_session_valid($user);
  if (empty($check['ok']) || empty($check['valid'])) {
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
      session_destroy();
    }
    $authenticated = false;
    $user = null;
  }
}

echo json_encode([
  'authenticated' => $authenticated,
  'user' => $user,
]);
