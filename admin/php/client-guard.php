<?php

function client_is_suspended(): bool
{
  return file_exists(__DIR__ . '/../.suspended');
}

function require_client_active(): void
{
  if (!client_is_suspended()) {
    return;
  }

  http_response_code(503);
  header('Content-Type: application/json');
  echo json_encode([
    'error' => 'Conta suspensa. Entre em contato com o suporte.',
    'suspended' => true,
  ]);
  exit;
}
