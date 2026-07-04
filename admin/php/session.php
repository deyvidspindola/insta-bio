<?php
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
header('Content-Type: application/json');

$authenticated = isset($_SESSION['user']);
echo json_encode([
  'authenticated' => $authenticated,
  'user' => $authenticated ? $_SESSION['user'] : null,
]);
