<?php

/**
 * Autenticação do editor contra a API do painel (fonte única de e-mail/senha).
 */

function editor_client_root(): string
{
  return dirname(__DIR__);
}

function editor_load_license_config(): ?array
{
  static $cache = null;
  if ($cache !== null) {
    return $cache ?: null;
  }

  $configFile = editor_client_root() . '/license.config.php';
  if (!is_file($configFile)) {
    $cache = false;
    return null;
  }

  require $configFile;

  if (!defined('LICENSE_SLUG') || !defined('LICENSE_TOKEN') || !defined('LICENSE_API')) {
    $cache = false;
    return null;
  }

  $cache = [
    'slug' => (string) LICENSE_SLUG,
    'token' => (string) LICENSE_TOKEN,
    'api' => (string) LICENSE_API,
    'selfhost' => defined('LICENSE_SELFHOST') && LICENSE_SELFHOST,
    'allowed_host' => defined('LICENSE_ALLOWED_HOST')
      ? editor_normalize_license_host((string) LICENSE_ALLOWED_HOST)
      : '',
    'deploy_path' => defined('LICENSE_DEPLOY_PATH')
      ? editor_normalize_deploy_path((string) LICENSE_DEPLOY_PATH)
      : '',
  ];

  return $cache;
}

function editor_normalize_license_host(string $host): string
{
  $host = strtolower(trim($host));
  if ($host === '') {
    return '';
  }
  if (str_contains($host, '://')) {
    $parsed = parse_url($host, PHP_URL_HOST);
    $host = is_string($parsed) ? $parsed : '';
  }
  $host = rtrim($host, '/');
  if (str_contains($host, ':')) {
    $host = explode(':', $host, 2)[0];
  }
  if (str_starts_with($host, 'www.')) {
    $host = substr($host, 4);
  }
  return $host;
}

function editor_normalize_deploy_path(string $path): string
{
  $path = strtolower(trim($path));
  if ($path === '' || $path === '/' || $path === '.' || $path === 'raiz' || $path === 'root') {
    return '';
  }
  $path = trim($path, '/');
  return preg_replace('/[^a-z0-9-]+/', '-', $path) ?? $path;
}

function editor_current_host(): string
{
  return editor_normalize_license_host((string) ($_SERVER['HTTP_HOST'] ?? ''));
}

/** Pasta do cliente (basename da raiz), igual ao gate de licença. */
function editor_deploy_slug(): string
{
  $base = basename(editor_client_root());
  return strtolower(preg_replace('/[^a-z0-9-]+/', '-', $base) ?? $base);
}

/**
 * Payload de autenticação de licença para a API do painel
 * (mesmo contrato de client-license.php / verificar-ambiente).
 *
 * @return array{slug: string, token: string, host?: string, deploy?: string}
 */
function editor_license_api_payload(array $extra = []): array
{
  $license = editor_load_license_config();
  if ($license === null) {
    return $extra;
  }

  $payload = array_merge([
    'slug' => $license['slug'],
    'token' => $license['token'],
  ], $extra);

  $deploy = editor_deploy_slug();
  if (!empty($license['selfhost'])) {
    $expected = editor_normalize_deploy_path((string) ($license['deploy_path'] ?? ''));
    $rootNames = ['public_html', 'htdocs', 'www', 'httpdocs', 'html'];
    if ($expected === '') {
      if ($deploy !== '' && !in_array($deploy, $rootNames, true)) {
        $payload['deploy'] = $deploy;
      }
    } elseif ($deploy !== '') {
      $payload['deploy'] = $deploy;
    }
  } elseif ($deploy !== '') {
    $payload['deploy'] = $deploy;
  }

  $host = editor_current_host();
  if ($host !== '') {
    $payload['host'] = $host;
  }

  return $payload;
}

function editor_platform_api_url(string $licenseApi, string $suffix): string
{
  $base = preg_replace('#/license/check$#', '', rtrim($licenseApi, '/'));
  return $base . '/' . ltrim($suffix, '/');
}

/**
 * @return array{ok: bool, user?: string, error?: string, http_status?: int}
 */
function editor_platform_post_json(string $url, array $payload): array
{
  $body = json_encode($payload);
  if ($body === false) {
    return ['ok' => false, 'error' => 'Não foi possível preparar a requisição'];
  }

  $responseBody = false;
  $status = 0;

  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => $body,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 10,
      CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json',
      ],
    ]);
    $responseBody = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
  } else {
    $context = stream_context_create([
      'http' => [
        'method' => 'POST',
        'timeout' => 10,
        'header' => "Content-Type: application/json\r\nAccept: application/json\r\n",
        'content' => $body,
      ],
    ]);
    $responseBody = @file_get_contents($url, false, $context);
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $matches)) {
      $status = (int) $matches[1];
    }
  }

  if ($responseBody === false) {
    return [
      'ok' => false,
      'http_status' => $status,
      'error' => 'Não foi possível contactar o painel para autenticar',
    ];
  }

  $data = json_decode((string) $responseBody, true);
  if (!is_array($data)) {
    return [
      'ok' => false,
      'http_status' => $status,
      'error' => 'Resposta inválida do painel',
    ];
  }

  if ($status >= 400 || empty($data['ok'])) {
    return [
      'ok' => false,
      'http_status' => $status,
      'error' => (string) ($data['error'] ?? 'Falha na autenticação'),
    ];
  }

  return array_merge(['ok' => true, 'http_status' => $status], $data);
}

/**
 * @return array{ok: bool, user?: string, error?: string}
 */
function editor_platform_login(string $email, string $password): array
{
  $license = editor_load_license_config();
  if ($license === null) {
    return ['ok' => false, 'error' => 'Licença do cliente não configurada'];
  }

  $url = editor_platform_api_url($license['api'], 'editor/login');
  $result = editor_platform_post_json($url, [
    'slug' => $license['slug'],
    'token' => $license['token'],
    'email' => strtolower(trim($email)),
    'password' => $password,
  ]);

  if (empty($result['ok'])) {
    return ['ok' => false, 'error' => $result['error'] ?? 'E-mail ou senha inválidos'];
  }

  return [
    'ok' => true,
    'user' => (string) ($result['user'] ?? $email),
  ];
}

/**
 * @return array{ok: bool, valid: bool}
 */
function editor_platform_session_valid(string $email): array
{
  $license = editor_load_license_config();
  if ($license === null) {
    return ['ok' => false, 'valid' => false];
  }

  $url = editor_platform_api_url($license['api'], 'editor/session');
  $result = editor_platform_post_json($url, [
    'slug' => $license['slug'],
    'token' => $license['token'],
    'email' => strtolower(trim($email)),
  ]);

  if (empty($result['ok'])) {
    return ['ok' => false, 'valid' => false];
  }

  return [
    'ok' => true,
    'valid' => !empty($result['valid']),
  ];
}

function editor_uses_remote_auth(): bool
{
  return editor_load_license_config() !== null;
}

/**
 * @return array{remoteAuth: bool, loginUrl?: string, sessionUrl?: string, slug?: string, token?: string}
 */
function editor_public_auth_config(): array
{
  $license = editor_load_license_config();
  if ($license === null) {
    return ['remoteAuth' => false];
  }

  return [
    'remoteAuth' => true,
    'loginUrl' => editor_platform_api_url($license['api'], 'editor/login'),
    'sessionUrl' => editor_platform_api_url($license['api'], 'editor/session'),
    'slug' => $license['slug'],
    'token' => $license['token'],
  ];
}

function editor_verify_auth_handshake(string $email, string $nonce, string $sig): bool
{
  $license = editor_load_license_config();
  if ($license === null) {
    return false;
  }

  if ($nonce === '' || $sig === '') {
    return false;
  }

  $email = strtolower(trim($email));
  $expected = hash_hmac(
    'sha256',
    $nonce . '|' . $email . '|' . strtolower(trim($license['slug'])),
    $license['token'],
  );

  return hash_equals($expected, $sig);
}

function editor_legacy_local_login(string $email, string $password): bool
{
  if (!defined('AUTH_USERNAME') || !defined('AUTH_PASSWORD_HASH')) {
    return false;
  }

  return $email === AUTH_USERNAME && password_verify($password, AUTH_PASSWORD_HASH);
}
