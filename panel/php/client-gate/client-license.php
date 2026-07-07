<?php

function client_license_root(): string
{
  $dir = __DIR__;
  if (basename($dir) === 'php' && basename(dirname($dir)) === 'editor') {
    return dirname($dir, 2);
  }
  return $dir;
}

function client_license_config_path(): string
{
  return client_license_root() . '/license.config.php';
}

function client_license_cache_path(): string
{
  return client_license_root() . '/.license-cache.json';
}

function client_license_normalize_slug(string $input): string
{
  $value = strtolower(trim($input));
  if (function_exists('iconv')) {
    $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
    if (is_string($converted) && $converted !== '') {
      $value = $converted;
    }
  }
  $value = preg_replace('/[^a-z0-9-]+/', '-', $value) ?? '';
  $value = preg_replace('/-+/', '-', $value) ?? '';
  return trim($value, '-');
}

function client_license_deploy_slug(): string
{
  return client_license_normalize_slug(basename(client_license_root()));
}

function client_license_load_config(): ?array
{
  static $cache = null;
  if ($cache !== null) {
    return $cache ?: null;
  }

  $configFile = client_license_config_path();
  if (!file_exists($configFile)) {
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
  ];
  return $cache;
}

function client_license_path_matches(array $config): bool
{
  if (!empty($config['selfhost'])) {
    return true;
  }

  $deploy = client_license_deploy_slug();
  $registered = client_license_normalize_slug($config['slug']);

  return $deploy !== '' && $deploy === $registered;
}

function client_license_cache_fingerprint(array $config): string
{
  $deploy = !empty($config['selfhost']) ? '' : client_license_deploy_slug();
  return hash('sha256', $config['slug'] . '|' . $config['token'] . '|' . $deploy);
}

function client_license_is_active(): bool
{
  $config = client_license_load_config();
  if ($config === null) {
    return false;
  }

  if (!client_license_path_matches($config)) {
    return false;
  }

  $fingerprint = client_license_cache_fingerprint($config);
  $cacheFile = client_license_cache_path();
  if (file_exists($cacheFile)) {
    $cached = json_decode((string) file_get_contents($cacheFile), true);
    if (
      is_array($cached)
      && isset($cached['active'], $cached['expires'], $cached['fp'])
      && $cached['fp'] === $fingerprint
      && (int) $cached['expires'] > time()
      && is_bool($cached['active'])
    ) {
      return $cached['active'];
    }
  }

  $active = client_license_fetch_remote(
    $config['api'],
    $config['slug'],
    $config['token'],
    !empty($config['selfhost']),
  );
  $payload = json_encode([
    'active' => $active,
    'fp' => $fingerprint,
    'expires' => time() + 300,
  ]);
  if ($payload !== false) {
    file_put_contents($cacheFile, $payload);
  }

  return $active;
}

function client_license_fetch_remote(string $apiUrl, string $slug, string $token, bool $selfhost = false): bool
{
  $params = [
    'slug' => $slug,
    'token' => $token,
  ];

  if (!$selfhost) {
    $deploy = client_license_deploy_slug();
    if ($deploy !== '') {
      $params['deploy'] = $deploy;
    }
  }

  $query = http_build_query($params);
  $url = str_contains($apiUrl, '?') ? $apiUrl . '&' . $query : $apiUrl . '?' . $query;

  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 8,
      CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
  } else {
    $context = stream_context_create([
      'http' => [
        'method' => 'GET',
        'timeout' => 8,
        'header' => "Accept: application/json\r\n",
      ],
    ]);
    $body = @file_get_contents($url, false, $context);
    $status = 0;
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
      $status = (int) $m[1];
    }
  }

  if ($body === false || $status >= 400) {
    return false;
  }

  $data = json_decode($body, true);
  return is_array($data) && !empty($data['ok']) && !empty($data['active']);
}

function client_license_deny(string $message = 'Esta bio está indisponível no momento.'): void
{
  $suspended = client_license_root() . '/suspended.html';
  http_response_code(503);
  if (file_exists($suspended)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($suspended);
    exit;
  }

  header('Content-Type: text/html; charset=utf-8');
  echo '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Indisponível</title></head>';
  echo '<body style="font-family:system-ui;text-align:center;padding:3rem">';
  echo '<h1>Indisponível</h1><p>' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p></body></html>';
  exit;
}

function require_client_license_active(): void
{
  if (!file_exists(client_license_config_path())) {
    client_license_deny('Licença não configurada.');
  }

  $config = client_license_load_config();
  if ($config === null) {
    client_license_deny('Licença não configurada.');
  }

  if (!client_license_path_matches($config)) {
    client_license_deny('Licença não corresponde a esta instalação.');
  }

  if (!client_license_is_active()) {
    client_license_deny('Conta suspensa ou licença inválida.');
  }
}
