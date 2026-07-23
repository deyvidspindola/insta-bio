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

function client_license_normalize_host(string $host): string
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

function client_license_current_host(): string
{
  return client_license_normalize_host((string) ($_SERVER['HTTP_HOST'] ?? ''));
}

function client_license_deploy_slug(): string
{
  return client_license_normalize_slug(basename(client_license_root()));
}

function client_license_root_folder_names(): array
{
  return ['public_html', 'htdocs', 'www', 'httpdocs', 'html'];
}

function client_license_normalize_deploy_path(string $path): string
{
  $path = strtolower(trim($path));
  if ($path === '' || $path === '/' || $path === '.' || $path === 'raiz' || $path === 'root') {
    return '';
  }

  $path = trim($path, '/');
  if ($path === '') {
    return '';
  }

  return client_license_normalize_slug($path);
}

function client_license_deploy_path_label(string $path): string
{
  $normalized = client_license_normalize_deploy_path($path);
  return $normalized === '' ? '/' : $normalized;
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

  // require_once: o mesmo arquivo também é carregado pelo editor (platform-auth).
  // Sem isso, define() dispara "Constant already defined" e quebra JSON das APIs.
  if (!defined('LICENSE_SLUG')) {
    require_once $configFile;
  }

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
      ? client_license_normalize_host((string) LICENSE_ALLOWED_HOST)
      : '',
    'deploy_path' => defined('LICENSE_DEPLOY_PATH')
      ? client_license_normalize_deploy_path((string) LICENSE_DEPLOY_PATH)
      : '',
  ];
  return $cache;
}

function client_license_host_matches(array $config): bool
{
  $allowed = $config['allowed_host'] ?? '';
  if ($allowed === '') {
    return true;
  }

  $current = client_license_current_host();
  return $current !== '' && $current === client_license_normalize_host($allowed);
}

function client_license_path_matches(array $config): bool
{
  if (!client_license_host_matches($config)) {
    return false;
  }

  if (!empty($config['selfhost'])) {
    $expected = client_license_normalize_deploy_path((string) ($config['deploy_path'] ?? ''));
    $actual = client_license_deploy_slug();

    if ($expected === '') {
      return in_array($actual, client_license_root_folder_names(), true);
    }

    return $actual !== '' && $actual === $expected;
  }

  $deploy = client_license_deploy_slug();
  $registered = client_license_normalize_slug($config['slug']);

  return $deploy !== '' && $deploy === $registered;
}

function client_license_cache_fingerprint(array $config): string
{
  $deploy = !empty($config['selfhost']) ? client_license_deploy_slug() : client_license_deploy_slug();
  return hash(
    'sha256',
    $config['slug'] . '|' . $config['token'] . '|' . $deploy . '|'
      . ($config['allowed_host'] ?? '') . '|' . ($config['deploy_path'] ?? ''),
  );
}

/**
 * @return array{ok: bool, http_status: int, active: bool, message: string, body: ?array}
 */
function client_license_probe_remote(array $config): array
{
  $result = client_license_fetch_remote($config, true);
  return $result;
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
      && ($cached['v'] ?? 0) === 2
      && isset($cached['active'], $cached['expires'], $cached['fp'])
      && $cached['fp'] === $fingerprint
      && (int) $cached['expires'] > time()
      && is_bool($cached['active'])
    ) {
      return $cached['active'];
    }
  }

  client_license_refresh_remote_cache($config);
  $cached = json_decode((string) @file_get_contents($cacheFile), true);
  return is_array($cached) && !empty($cached['active']);
}

/**
 * Atualiza .license-cache.json com active + analytics_key da API do painel.
 */
function client_license_refresh_remote_cache(array $config): void
{
  $probe = client_license_fetch_remote($config, false);
  $active = !empty($probe['ok']) && !empty($probe['active']);
  $body = is_array($probe['body'] ?? null) ? $probe['body'] : [];
  $payload = json_encode([
    'v' => 2,
    'active' => $active,
    'fp' => client_license_cache_fingerprint($config),
    'expires' => time() + 300,
    'akey' => trim((string) ($body['analytics_key'] ?? '')),
    'aurl' => trim((string) ($body['analytics_url'] ?? '')),
  ]);
  if ($payload !== false) {
    file_put_contents(client_license_cache_path(), $payload);
  }
}

/**
 * @return array{akey: string, aurl: string}
 */
function client_license_remote_meta(bool $refreshIfEmpty = true): array
{
  static $didRefresh = false;

  $cacheFile = client_license_cache_path();
  if (!file_exists($cacheFile)) {
    $empty = ['akey' => '', 'aurl' => ''];
    if (!$refreshIfEmpty || $didRefresh) {
      return $empty;
    }
    $config = client_license_load_config();
    if ($config === null) {
      return $empty;
    }
    $didRefresh = true;
    client_license_refresh_remote_cache($config);
    return client_license_remote_meta(false);
  }

  $cached = json_decode((string) file_get_contents($cacheFile), true);
  if (!is_array($cached)) {
    return ['akey' => '', 'aurl' => ''];
  }

  $akey = trim((string) ($cached['akey'] ?? ''));
  $aurl = trim((string) ($cached['aurl'] ?? ''));

  // Cache antigo (antes do analytics) pode ter active sem akey — busca de novo.
  if ($akey === '' && $refreshIfEmpty && !$didRefresh) {
    $config = client_license_load_config();
    if ($config !== null) {
      $didRefresh = true;
      client_license_refresh_remote_cache($config);
      return client_license_remote_meta(false);
    }
  }

  return [
    'akey' => $akey,
    'aurl' => $aurl,
  ];
}

function client_license_analytics_key(): string
{
  return client_license_resolve_analytics_key();
}

function client_license_analytics_url(): string
{
  return client_license_resolve_analytics_url();
}

/**
 * Chave de analytics: preferir a da API do painel (MySQL); ANALYTICS_KEY do
 * license.config é só fallback (pode ficar órfã após reinstalação/migração).
 */
function client_license_resolve_analytics_key(): string
{
  client_license_load_config();

  $remote = trim(client_license_remote_meta()['akey'] ?? '');
  if ($remote !== '') {
    return $remote;
  }

  if (defined('ANALYTICS_KEY') && ANALYTICS_KEY !== '') {
    return trim((string) ANALYTICS_KEY);
  }

  return '';
}

/**
 * URL do painel (só server-side). Nunca injetar no HTML.
 */
function client_license_resolve_analytics_url(): string
{
  client_license_load_config();

  if (defined('ANALYTICS_API') && ANALYTICS_API !== '') {
    return rtrim(trim((string) ANALYTICS_API), '/');
  }

  $remote = trim(client_license_remote_meta()['aurl'] ?? '');
  if ($remote !== '') {
    return rtrim($remote, '/');
  }

  if (!defined('LICENSE_API') || LICENSE_API === '') {
    return '';
  }

  $api = rtrim(trim((string) LICENSE_API), '/');
  if ($api === '') {
    return '';
  }
  if (str_ends_with($api, '/api/license/check')) {
    return substr($api, 0, -strlen('/api/license/check')) . '/api/analytics/track';
  }
  if (preg_match('#/panel$#', $api)) {
    return $api . '/api/analytics/track';
  }

  $replaced = preg_replace('#/api/.*$#', '/api/analytics/track', $api);
  return is_string($replaced) && $replaced !== '' ? $replaced : ($api . '/api/analytics/track');
}

/**
 * @return array{ok: bool, http_status: int, active: bool, message: string, body: ?array}
 */
function client_license_fetch_remote(array $config, bool $detailed = false): array
{
  $params = [
    'slug' => $config['slug'],
    'token' => $config['token'],
  ];

  $deploy = client_license_deploy_slug();
  if (!empty($config['selfhost'])) {
    $expected = client_license_normalize_deploy_path((string) ($config['deploy_path'] ?? ''));
    if ($expected === '') {
      if (!in_array($deploy, client_license_root_folder_names(), true) && $deploy !== '') {
        $params['deploy'] = $deploy;
      }
    } elseif ($deploy !== '') {
      $params['deploy'] = $deploy;
    }
  } elseif ($deploy !== '') {
    $params['deploy'] = $deploy;
  }

  $currentHost = client_license_current_host();
  if ($currentHost !== '') {
    $params['host'] = $currentHost;
  }

  $query = http_build_query($params);
  $url = str_contains($config['api'], '?') ? $config['api'] . '&' . $query : $config['api'] . '?' . $query;

  $body = false;
  $status = 0;

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
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
      $status = (int) $m[1];
    }
  }

  if ($body === false || $status >= 400) {
    return [
      'ok' => false,
      'http_status' => $status,
      'active' => false,
      'message' => $status > 0
        ? 'API respondeu HTTP ' . $status
        : 'Não foi possível contactar a API de licença',
      'body' => null,
    ];
  }

  $data = json_decode((string) $body, true);
  if (!is_array($data) || empty($data['ok'])) {
    $error = is_array($data) ? (string) ($data['error'] ?? 'Licença recusada pela API') : 'Resposta inválida da API';
    return [
      'ok' => false,
      'http_status' => $status,
      'active' => false,
      'message' => $error,
      'body' => is_array($data) ? $data : null,
    ];
  }

  $active = !empty($data['active']);
  return [
    'ok' => true,
    'http_status' => $status,
    'active' => $active,
    'message' => $active ? 'Licença ativa na API' : 'Conta suspensa ou inativa na API',
    'body' => $data,
  ];
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

  if (!client_license_host_matches($config)) {
    client_license_deny('Este domínio não está autorizado para esta licença.');
  }

  if (!client_license_path_matches($config)) {
    client_license_deny('Licença não corresponde a esta instalação.');
  }

  if (!client_license_is_active()) {
    client_license_deny('Conta suspensa ou licença inválida.');
  }
}

/**
 * Proxy same-origin de analytics (bio → painel).
 * Vive em client-license.php para ser aplicado mesmo quando o update-apply
 * antigo não copia analytics-track.php.
 */
function client_analytics_proxy_run(): void
{
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store, no-cache, must-revalidate');

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }

  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método não permitido']);
    exit;
  }

  if (file_exists(client_license_root() . '/.suspended')) {
    echo json_encode(['ok' => true, 'skipped' => 'suspended']);
    exit;
  }

  $config = client_license_load_config();
  if ($config === null) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Licença não configurada']);
    exit;
  }

  $raw = file_get_contents('php://input');
  if ($raw === false || strlen($raw) > 4096) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Payload inválido ou grande demais']);
    exit;
  }

  $input = json_decode($raw, true);
  if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'JSON inválido']);
    exit;
  }

  $analyticsKey = client_license_resolve_analytics_key();
  $trackUrl = client_license_resolve_analytics_url();
  if ($analyticsKey === '' || $trackUrl === '') {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Analytics não configurado']);
    exit;
  }

  // Sempre usa a chave do servidor — ignora valor forjado no body.
  $input['analytics_key'] = $analyticsKey;
  // Fallback de identidade: se a key do config estiver órfã no MySQL, o painel
  // resolve pelo par slug+token (mesmo segredo do license-check).
  $input['license_slug'] = (string) ($config['slug'] ?? '');
  $input['license_token'] = (string) ($config['token'] ?? '');
  $input['license_deploy'] = client_license_deploy_slug();
  $input['license_host'] = client_license_current_host();

  $body = json_encode($input, JSON_UNESCAPED_SLASHES);
  if ($body === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Falha ao preparar payload']);
    exit;
  }

  // Encaminha UA/IP do visitante — sem isso o painel vê curl/ (ou vazio) e marca bot.
  $visitorUa = mb_substr(trim((string) ($_SERVER['HTTP_USER_AGENT'] ?? '')), 0, 255);
  $visitorIp = trim((string) ($_SERVER['REMOTE_ADDR'] ?? ''));
  if ($visitorIp !== '' && filter_var($visitorIp, FILTER_VALIDATE_IP) === false) {
    $visitorIp = '';
  }

  $headers = [
    'Content-Type: application/json',
    'Accept: application/json',
    'X-Insta-Bio-Proxy: 1',
  ];
  if ($visitorUa !== '') {
    $headers[] = 'X-Forwarded-User-Agent: ' . $visitorUa;
  }
  if ($visitorIp !== '') {
    $headers[] = 'X-Forwarded-For: ' . $visitorIp;
  }

  $responseBody = false;
  $status = 0;

  if (function_exists('curl_init')) {
    $ch = curl_init($trackUrl);
    $curlOpts = [
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => $body,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 8,
      CURLOPT_HTTPHEADER => $headers,
      // Evita User-Agent padrão "curl/x.y" (o painel trata como bot).
      CURLOPT_USERAGENT => $visitorUa !== '' ? $visitorUa : 'InstaBio-Proxy/1.0',
    ];
    curl_setopt_array($ch, $curlOpts);
    $responseBody = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
  } else {
    $headerLines = implode("\r\n", $headers) . "\r\n";
    if ($visitorUa !== '') {
      $headerLines .= 'User-Agent: ' . $visitorUa . "\r\n";
    }
    $context = stream_context_create([
      'http' => [
        'method' => 'POST',
        'timeout' => 8,
        'header' => $headerLines,
        'content' => $body,
        'ignore_errors' => true,
      ],
    ]);
    $responseBody = @file_get_contents($trackUrl, false, $context);
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $matches)) {
      $status = (int) $matches[1];
    }
  }

  if ($responseBody === false) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'Não foi possível contactar o painel']);
    exit;
  }

  if ($status >= 100) {
    http_response_code($status);
  }

  $decoded = json_decode((string) $responseBody, true);
  if (is_array($decoded)) {
    echo json_encode($decoded);
    exit;
  }

  echo json_encode(['ok' => $status >= 200 && $status < 300]);
}
