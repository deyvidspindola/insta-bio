<?php
require __DIR__ . '/platform-auth.php';
require __DIR__ . '/client-guard.php';
require_client_active();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

echo json_encode(editor_public_auth_config());
