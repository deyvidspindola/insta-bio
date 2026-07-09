<?php
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
$_SESSION = [];
session_destroy();
header('Content-Type: application/json');
echo json_encode(['ok' => true]);
