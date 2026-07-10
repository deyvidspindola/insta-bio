<?php

/**
 * Sanitização / validação de entrada do painel.
 * PDO prepared statements já bloqueiam SQL injection; estes helpers
 * limitam formato, tamanho e tipos antes de qualquer query ou I/O.
 */

function platform_input_string(mixed $value, int $maxLen = 255): string
{
  if ($value === null) {
    return '';
  }
  $text = trim((string) $value);
  // Remove bytes nulos e controles (exceto tab/LF/CR se precisar — aqui cortamos tudo).
  $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? '';
  if (function_exists('mb_substr')) {
    return mb_substr($text, 0, $maxLen);
  }
  return substr($text, 0, $maxLen);
}

function platform_input_email(mixed $value): string
{
  $email = strtolower(platform_input_string($value, 190));
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    throw new InvalidArgumentException('E-mail inválido');
  }
  return $email;
}

function platform_input_optional_email(mixed $value): string
{
  $email = strtolower(platform_input_string($value, 190));
  if ($email === '') {
    return '';
  }
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    throw new InvalidArgumentException('E-mail inválido');
  }
  return $email;
}

function platform_input_id(mixed $value): int
{
  if (is_int($value)) {
    return $value > 0 ? $value : 0;
  }
  if (is_string($value) && ctype_digit($value)) {
    $id = (int) $value;
    return $id > 0 ? $id : 0;
  }
  if (is_float($value) && $value > 0 && floor($value) === $value) {
    return (int) $value;
  }
  return 0;
}

function platform_input_bool(mixed $value): bool
{
  if (is_bool($value)) {
    return $value;
  }
  if (is_int($value) || is_float($value)) {
    return (int) $value === 1;
  }
  if (is_string($value)) {
    $v = strtolower(trim($value));
    return in_array($v, ['1', 'true', 'yes', 'on'], true);
  }
  return !empty($value);
}

/**
 * Status permitido na tabela clients.
 */
function platform_input_client_status(mixed $value): string
{
  $status = strtolower(platform_input_string($value, 32));
  $allowed = ['active', 'suspended'];
  if (!in_array($status, $allowed, true)) {
    throw new InvalidArgumentException('Status inválido');
  }
  return $status;
}

function platform_input_password(mixed $value, int $minLen = 6, int $maxLen = 128): string
{
  // Senha: não aplicar strip agressivo além de limite de tamanho.
  $password = (string) $value;
  if (strlen($password) > $maxLen) {
    throw new InvalidArgumentException('Senha muito longa');
  }
  if ($password !== '' && strlen($password) < $minLen) {
    throw new InvalidArgumentException("A senha deve ter pelo menos {$minLen} caracteres");
  }
  return $password;
}

function platform_input_token(mixed $value, int $maxLen = 128): string
{
  $token = platform_input_string($value, $maxLen);
  // Tokens de licença: alfanumérico e alguns símbolos seguros.
  if ($token !== '' && !preg_match('/^[A-Za-z0-9._\-]+$/', $token)) {
    throw new InvalidArgumentException('Token inválido');
  }
  return $token;
}

function platform_input_host(mixed $value, int $maxLen = 255): string
{
  $host = strtolower(platform_input_string($value, $maxLen));
  if ($host === '') {
    return '';
  }
  if (str_contains($host, '://')) {
    $parsed = parse_url($host, PHP_URL_HOST);
    $host = is_string($parsed) ? strtolower($parsed) : '';
  }
  $host = rtrim($host, '/');
  if (str_contains($host, ':')) {
    $host = explode(':', $host, 2)[0];
  }
  if (str_starts_with($host, 'www.')) {
    $host = substr($host, 4);
  }
  if ($host === '') {
    return '';
  }
  if (!preg_match('/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/', $host)) {
    throw new InvalidArgumentException('Domínio inválido');
  }
  return $host;
}

function platform_input_deploy_path(mixed $value, int $maxLen = 255): string
{
  $path = platform_input_string($value, $maxLen);
  $path = str_replace('\\', '/', $path);
  if ($path === '' || $path === '/' || strtolower($path) === 'raiz' || strtolower($path) === 'root' || $path === '.') {
    return $path === '' ? '' : '/';
  }
  if (str_contains($path, '..') || str_contains($path, "\0")) {
    throw new InvalidArgumentException('Caminho de deploy inválido');
  }
  $trimmed = trim($path, '/');
  if ($trimmed !== '' && !preg_match('#^[A-Za-z0-9][A-Za-z0-9._/\-]*$#', $trimmed)) {
    throw new InvalidArgumentException('Caminho de deploy inválido');
  }
  return $path;
}

function platform_input_instagram_handle(mixed $value): string
{
  $handle = platform_input_string($value, 64);
  $handle = ltrim($handle, '@');
  $handle = trim($handle, '/');
  if ($handle === '') {
    return '';
  }
  if (!preg_match('/^[A-Za-z0-9._]{1,30}$/', $handle)) {
    throw new InvalidArgumentException('Instagram inválido');
  }
  return $handle;
}

/**
 * Nome de exibição: remove tags HTML e limita tamanho.
 */
function platform_input_name(mixed $value, int $maxLen = 120): string
{
  $name = platform_input_string($value, $maxLen);
  $name = strip_tags($name);
  $name = trim($name);
  if ($name === '') {
    throw new InvalidArgumentException('Nome é obrigatório');
  }
  return $name;
}
