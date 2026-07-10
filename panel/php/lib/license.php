<?php

function generate_license_token(): string
{
  return bin2hex(random_bytes(24));
}

function platform_ensure_license_column(PDO $pdo): void
{
  static $done = false;
  if ($done) {
    return;
  }
  $done = true;

  $stmt = $pdo->query("SHOW COLUMNS FROM clients LIKE 'license_token'");
  if (!$stmt->fetch()) {
    $pdo->exec(
      'ALTER TABLE clients ADD COLUMN license_token CHAR(48) NULL UNIQUE AFTER status',
    );
  }

  $stmt = $pdo->query("SHOW COLUMNS FROM clients LIKE 'allowed_host'");
  if (!$stmt->fetch()) {
    $pdo->exec(
      "ALTER TABLE clients ADD COLUMN allowed_host VARCHAR(255) NULL DEFAULT NULL AFTER license_token",
    );
  }

  $stmt = $pdo->query("SHOW COLUMNS FROM clients LIKE 'self_hosted'");
  if (!$stmt->fetch()) {
    $pdo->exec(
      'ALTER TABLE clients ADD COLUMN self_hosted TINYINT(1) NOT NULL DEFAULT 0 AFTER allowed_host',
    );
  }

  $stmt = $pdo->query("SHOW COLUMNS FROM clients LIKE 'deploy_path'");
  if (!$stmt->fetch()) {
    $pdo->exec(
      "ALTER TABLE clients ADD COLUMN deploy_path VARCHAR(255) NULL DEFAULT NULL AFTER self_hosted",
    );
  }
}

function normalize_license_host(string $host): string
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

function validate_license_host(string $host): ?string
{
  $normalized = normalize_license_host($host);
  if ($normalized === '') {
    return 'Informe o domínio (ex.: cliente.com.br)';
  }

  if (!preg_match('/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/', $normalized)) {
    return 'Domínio inválido';
  }

  return null;
}

function normalize_deploy_path(string $path): string
{
  $path = strtolower(trim($path));
  if ($path === '' || $path === '/' || $path === '.' || $path === 'raiz' || $path === 'root') {
    return '';
  }

  $path = trim($path, '/');
  if ($path === '') {
    return '';
  }

  return normalize_slug($path);
}

function deploy_path_for_display(?string $path): string
{
  $normalized = normalize_deploy_path((string) $path);
  return $normalized === '' ? '/' : $normalized;
}

function deploy_path_from_input(string $input): string
{
  return normalize_deploy_path($input);
}

function validate_deploy_path(string $path): ?string
{
  $raw = trim($path);
  if ($raw === '') {
    return 'Informe a pasta no domínio (use / para a raiz)';
  }

  $normalized = normalize_deploy_path($raw);
  if ($normalized === '' && !in_array(strtolower($raw), ['/', '.', 'raiz', 'root'], true)) {
    return 'Pasta inválida — use letras, números e hífens (ou / para raiz)';
  }

  return null;
}

/**
 * @return array{self_hosted: bool, allowed_host: ?string, deploy_path: ?string}
 */
function resolve_client_hosting_input(
  bool $selfHosted,
  string $allowedHostInput,
  string $deployPathInput,
): array {
  if (!$selfHosted) {
    return [
      'self_hosted' => false,
      'allowed_host' => null,
      'deploy_path' => null,
    ];
  }

  $allowedHost = normalize_license_host($allowedHostInput);
  if ($allowedHost === '') {
    throw new InvalidArgumentException('Informe o domínio autorizado para hospedagem própria');
  }

  $hostError = validate_license_host($allowedHost);
  if ($hostError !== null) {
    throw new InvalidArgumentException($hostError);
  }

  $pathError = validate_deploy_path($deployPathInput);
  if ($pathError !== null) {
    throw new InvalidArgumentException($pathError);
  }

  return [
    'self_hosted' => true,
    'allowed_host' => $allowedHost,
    'deploy_path' => normalize_deploy_path($deployPathInput),
  ];
}

function deploy_path_matches_request(string $expectedPath, string $requestDeploy): bool
{
  $expectedPath = normalize_deploy_path($expectedPath);
  $requestDeploy = normalize_slug($requestDeploy);

  if ($expectedPath === '') {
    if ($requestDeploy === '') {
      return true;
    }

    return in_array($requestDeploy, ['public_html', 'htdocs', 'www', 'httpdocs', 'html'], true);
  }

  return $requestDeploy !== '' && $requestDeploy === $expectedPath;
}

function build_client_license_config_content(
  string $slug,
  string $token,
  string $platformBaseUrl,
  bool $selfhost = false,
  string $allowedHost = '',
  string $deployPath = '',
): string {
  $slugEsc = addslashes($slug);
  $tokenEsc = addslashes($token);
  $apiEsc = addslashes(rtrim($platformBaseUrl, '/') . '/panel/api/license/check');
  $selfhostLiteral = $selfhost ? 'true' : 'false';
  $allowedHost = normalize_license_host($allowedHost);
  $allowedHostEsc = addslashes($allowedHost);

  $allowedHostLine = $allowedHost !== ''
    ? "define('LICENSE_ALLOWED_HOST', '{$allowedHostEsc}');\n"
    : '';

  $deployPath = normalize_deploy_path($deployPath);
  $deployPathEsc = addslashes($deployPath);
  $deployPathLine = $selfhost
    ? "define('LICENSE_DEPLOY_PATH', '{$deployPathEsc}');\n"
    : '';

  return <<<PHP
<?php
// Gerado pelo painel — não remova. Sem este arquivo a bio não carrega.
define('LICENSE_SLUG', '{$slugEsc}');
define('LICENSE_TOKEN', '{$tokenEsc}');
define('LICENSE_SELFHOST', {$selfhostLiteral});
{$allowedHostLine}{$deployPathLine}define('LICENSE_API', '{$apiEsc}');

PHP;
}

/**
 * @return array{loginUrl: string, sessionUrl: string}
 */
function editor_platform_api_urls(string $platformBaseUrl): array
{
  $apiBase = rtrim($platformBaseUrl, '/') . '/panel/api';
  return [
    'loginUrl' => $apiBase . '/editor/login',
    'sessionUrl' => $apiBase . '/editor/session',
  ];
}

function editor_platform_api_json_content(
  string $slug,
  string $token,
  string $platformBaseUrl,
): string {
  $urls = editor_platform_api_urls($platformBaseUrl);
  $payload = [
    'remoteAuth' => true,
    'loginUrl' => $urls['loginUrl'],
    'sessionUrl' => $urls['sessionUrl'],
    'slug' => normalize_slug($slug),
    'token' => $token,
  ];

  $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  if ($json === false) {
    throw new RuntimeException('Não foi possível preparar platform-api.json');
  }

  return $json . "\n";
}

function write_editor_platform_api_json(
  string $editorDir,
  string $slug,
  string $token,
  string $platformBaseUrl,
): void {
  $content = editor_platform_api_json_content($slug, $token, $platformBaseUrl);
  if (file_put_contents($editorDir . DIRECTORY_SEPARATOR . 'platform-api.json', $content) === false) {
    throw new RuntimeException('Não foi possível gravar platform-api.json');
  }
}

function write_client_license_config(
  string $clientDir,
  string $slug,
  string $token,
  string $platformBaseUrl,
  bool $selfhost = false,
  string $allowedHost = '',
  string $deployPath = '',
): void {
  $content = build_client_license_config_content(
    $slug,
    $token,
    $platformBaseUrl,
    $selfhost,
    $allowedHost,
    $deployPath,
  );

  if (file_put_contents($clientDir . DIRECTORY_SEPARATOR . 'license.config.php', $content) === false) {
    throw new RuntimeException('Não foi possível gravar license.config.php');
  }
}

function platform_public_base_url(): string
{
  if (defined('PLATFORM_PUBLIC_URL') && PLATFORM_PUBLIC_URL !== '') {
    return rtrim(PLATFORM_PUBLIC_URL, '/');
  }

  $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
  $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
  return $scheme . '://' . $host;
}

function lookup_client_license(PDO $pdo, string $slug, string $token, string $deploySlug = '', string $requestHost = ''): ?array
{
  platform_ensure_license_column($pdo);

  $stmt = platform_db_execute(
    $pdo,
    'SELECT id, slug, status, allowed_host, self_hosted, deploy_path FROM clients WHERE slug = ? AND license_token = ? LIMIT 1',
    [normalize_slug($slug), $token],
  );
  $row = $stmt->fetch();
  if (!$row) {
    return null;
  }

  $selfHosted = !empty($row['self_hosted']);

  if ($selfHosted) {
    $allowedHost = normalize_license_host((string) ($row['allowed_host'] ?? ''));
    if ($allowedHost !== '') {
      $requestHost = normalize_license_host($requestHost);
      if ($requestHost === '' || $requestHost !== $allowedHost) {
        return null;
      }
    }

    if (!deploy_path_matches_request((string) ($row['deploy_path'] ?? ''), $deploySlug)) {
      return null;
    }
  } else {
    $deploySlug = normalize_slug($deploySlug);
    if ($deploySlug !== '' && $deploySlug !== $row['slug']) {
      return null;
    }
  }

  return $row;
}

/** @deprecated Use build_client_license_config_content com allowed_host */
function license_config_for_selfhost_export(string $content): string
{
  return $content;
}

function install_client_license_gate_files(string $clientDir): void
{
  $gateDir = dirname(__DIR__) . '/client-gate';
  $gatePhp = $gateDir . '/index-gate.php';
  $licensePhp = $gateDir . '/client-license.php';

  if (!file_exists($gatePhp) || !file_exists($licensePhp)) {
    throw new RuntimeException('Arquivos de licença do cliente não encontrados no pacote');
  }

  copy($gatePhp, $clientDir . DIRECTORY_SEPARATOR . 'index.php');
  copy($licensePhp, $clientDir . DIRECTORY_SEPARATOR . 'client-license.php');

  $shareMetaPhp = $gateDir . '/bio-share-meta.php';
  if (file_exists($shareMetaPhp)) {
    copy($shareMetaPhp, $clientDir . DIRECTORY_SEPARATOR . 'bio-share-meta.php');
  }

  $guardPhp = $gateDir . '/client-guard.php';
  $editorDir = $clientDir . DIRECTORY_SEPARATOR . 'editor';
  if (file_exists($guardPhp) && is_dir($editorDir)) {
    copy($guardPhp, $editorDir . DIRECTORY_SEPARATOR . 'client-guard.php');
  }

  $verifyPhp = $gateDir . '/verificar-ambiente.php';
  if (file_exists($verifyPhp)) {
    copy($verifyPhp, $clientDir . DIRECTORY_SEPARATOR . 'verificar-ambiente.php');
  }

  $bioJsonPhp = $gateDir . '/bio-json.php';
  if (file_exists($bioJsonPhp)) {
    copy($bioJsonPhp, $clientDir . DIRECTORY_SEPARATOR . 'bio-json.php');
  }
}

function sync_client_license_files(PDO $pdo, string $platformRoot, array $client): string
{
  platform_ensure_license_column($pdo);

  $token = trim((string) ($client['license_token'] ?? ''));
  if ($token === '') {
    $token = generate_license_token();
    platform_db_execute(
      $pdo,
      'UPDATE clients SET license_token = ? WHERE id = ?',
      [$token, $client['id']],
    );
  }

  $slug = normalize_slug((string) $client['slug']);
  $clientDir = rtrim($platformRoot, '/\\') . DIRECTORY_SEPARATOR . $slug;
  if (!is_dir($clientDir)) {
    throw new RuntimeException('Pasta do cliente não encontrada');
  }

  $selfHosted = !empty($client['self_hosted']);
  $allowedHost = $selfHosted ? normalize_license_host((string) ($client['allowed_host'] ?? '')) : '';
  $deployPath = $selfHosted ? normalize_deploy_path((string) ($client['deploy_path'] ?? '')) : '';
  write_client_license_config(
    $clientDir,
    $slug,
    $token,
    platform_public_base_url(),
    $selfHosted,
    $allowedHost,
    $deployPath,
  );
  install_client_license_gate_files($clientDir);
  write_client_htaccess($clientDir);

  require_once __DIR__ . '/platform.php';
  $editorDir = $clientDir . DIRECTORY_SEPARATOR . 'editor';
  if (is_dir($editorDir)) {
    write_editor_paths_config($editorDir);
    write_editor_platform_api_json($editorDir, $slug, $token, platform_public_base_url());

    require_once __DIR__ . '/bio-path.php';
    $authFile = $editorDir . DIRECTORY_SEPARATOR . 'auth.config.php';
    $bioPath = platform_parse_auth_bio_json_path($authFile);
    if ($bioPath !== null) {
      write_bio_path_json($clientDir, $bioPath);
    }
  }

  return $token;
}

function client_selfhost_htaccess(): string
{
  return <<<'HTACCESS'
# Links na Bio — hospedagem própria do cliente
Options -Indexes -MultiViews
DirectoryIndex index.php index.html

<Files "license.config.php">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
</Files>

<Files ".license-cache.json">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
</Files>

<IfModule mod_rewrite.c>
  RewriteEngine On

  RewriteCond %{REQUEST_URI} !/suspended\.html$ [NC]
  RewriteCond .suspended -f
  RewriteRule ^ suspended.html [L]

  RewriteRule ^editor$ editor/ [R=301,L]

  # Bio pública sempre passa pelo gate de licença
  RewriteRule ^index\.html$ index.php [L]
</IfModule>

<Files "bio.json">
  <IfModule mod_headers.c>
    Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </IfModule>
</Files>

<Files "bio.draft.json">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
</Files>
HTACCESS;
}

function client_export_readme(
  string $slug,
  string $platformUrl,
  string $allowedHost = '',
  string $deployPath = '',
  string $bioSource = 'published',
): string {
  $platformUrl = rtrim($platformUrl, '/');
  $deployLabel = deploy_path_for_display($deployPath);
  $bioNote = $bioSource === 'draft'
    ? "9. Atenção: a bio publicada estava vazia — o ZIP incluiu o rascunho do editor. Publique no painel antes de exportar para garantir o mesmo conteúdo ao vivo.\n"
    : "9. O ZIP inclui a bio publicada (a mesma exibida em /{$slug}/ na plataforma).\n";

  return <<<TXT
Links na Bio — pacote para hospedagem própria
============================================

1. Extraia este ZIP na pasta autorizada do domínio cadastrado.
2. Domínio autorizado: {$allowedHost}
3. Pasta no domínio: {$deployLabel} (raiz = /)
4. Acesse verificar-ambiente.php para testar PHP, permissões, pasta, domínio e API de licença.
5. Não remova license.config.php nem index.php — sem eles a bio não carrega.
6. A licença é validada em: {$platformUrl}/panel/api/license/check
7. Se a conta for suspensa no painel, a bio deixa de funcionar automaticamente.
8. Editor: acesse /editor/ no mesmo domínio e pasta (ex.: https://seudominio.com.br{$deployLabel}editor/)
{$bioNote}
Slug no painel: {$slug}

TXT;
}
