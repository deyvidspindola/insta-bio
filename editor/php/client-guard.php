<?php

function client_root_dir(): string
{
  // PHP do editor fica em {slug}/editor/ (não em editor/php/)
  return dirname(__DIR__);
}

function client_is_suspended(): bool
{
  return file_exists(client_root_dir() . '/.suspended');
}

function require_client_active(): void
{
  if (client_is_suspended()) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
      'error' => 'Conta suspensa. Entre em contato com o suporte.',
      'suspended' => true,
    ]);
    exit;
  }

  $licenseHelper = client_root_dir() . '/client-license.php';
  if (!file_exists($licenseHelper)) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
      'error' => 'Licença não configurada.',
      'suspended' => true,
    ]);
    exit;
  }

  require_once $licenseHelper;
  if (!client_license_is_active()) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
      'error' => 'Conta suspensa ou licença inválida.',
      'suspended' => true,
    ]);
    exit;
  }
}
