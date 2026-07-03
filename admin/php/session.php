<?php
session_start();
header('Content-Type: application/json');

$authenticated = isset($_SESSION['user']);
echo json_encode([
  'authenticated' => $authenticated,
  'user' => $authenticated ? $_SESSION['user'] : null,
]);
