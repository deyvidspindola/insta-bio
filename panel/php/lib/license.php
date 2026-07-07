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
  if ($stmt->fetch()) {
    return;
  }

  $pdo->exec(
    'ALTER TABLE clients ADD COLUMN license_token CHAR(48) NULL UNIQUE AFTER status',
  );
}

function write_client_license_config(
  string $clientDir,
  string $slug,
  string $token,
  string $platformBaseUrl,
  bool $selfhost = false,
): void
{
  $slugEsc = addslashes($slug);
  $tokenEsc = addslashes($token);
  $apiEsc = addslashes(rtrim($platformBaseUrl, '/') . '/panel/api/license/check');
  $selfhostLiteral = $selfhost ? 'true' : 'false';

  $content = <<<PHP
<?php
// Gerado pelo painel — não remova. Sem este arquivo a bio não carrega.
define('LICENSE_SLUG', '{$slugEsc}');
define('LICENSE_TOKEN', '{$tokenEsc}');
define('LICENSE_SELFHOST', {$selfhostLiteral});
define('LICENSE_API', '{$apiEsc}');

PHP;

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

function lookup_client_license(PDO $pdo, string $slug, string $token, string $deploySlug = ''): ?array
{
  $stmt = $pdo->prepare(
    'SELECT id, slug, status FROM clients WHERE slug = ? AND license_token = ? LIMIT 1',
  );
  $stmt->execute([normalize_slug($slug), $token]);
  $row = $stmt->fetch();
  if (!$row) {
    return null;
  }

  $deploySlug = normalize_slug($deploySlug);
  if ($deploySlug !== '' && $deploySlug !== $row['slug']) {
    return null;
  }

  return $row;
}

function license_config_for_selfhost_export(string $content): string
{
  if (str_contains($content, 'LICENSE_SELFHOST')) {
    return (string) preg_replace(
      "/define\\('LICENSE_SELFHOST',\\s*(?:true|false)\\);/",
      "define('LICENSE_SELFHOST', true);",
      $content,
      1,
    );
  }

  return str_replace(
    "define('LICENSE_API'",
    "define('LICENSE_SELFHOST', true);\ndefine('LICENSE_API'",
    $content,
  );
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
}

function sync_client_license_files(PDO $pdo, string $platformRoot, array $client): string
{
  platform_ensure_license_column($pdo);

  $token = trim((string) ($client['license_token'] ?? ''));
  if ($token === '') {
    $token = generate_license_token();
    $stmt = $pdo->prepare('UPDATE clients SET license_token = ? WHERE id = ?');
    $stmt->execute([$token, $client['id']]);
  }

  $slug = normalize_slug((string) $client['slug']);
  $clientDir = rtrim($platformRoot, '/\\') . DIRECTORY_SEPARATOR . $slug;
  if (!is_dir($clientDir)) {
    throw new RuntimeException('Pasta do cliente não encontrada');
  }

  write_client_license_config($clientDir, $slug, $token, platform_public_base_url());
  install_client_license_gate_files($clientDir);
  write_client_htaccess($clientDir);

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
</IfModule>

<Files "bio.json">
  <IfModule mod_headers.c>
    Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </IfModule>
</Files>
HTACCESS;
}

function client_export_readme(string $slug, string $platformUrl): string
{
  $platformUrl = rtrim($platformUrl, '/');

  return <<<TXT
Links na Bio — pacote para hospedagem própria
============================================

1. Extraia este ZIP na raiz do seu domínio (public_html).
2. Não remova license.config.php nem index.php — sem eles a bio não carrega.
3. A licença é validada em: {$platformUrl}/panel/api/license/check
4. Se a conta for suspensa no painel, a bio deixa de funcionar automaticamente.
5. Editor: acesse /editor/ no mesmo domínio (ex.: https://seudominio.com.br/editor/)

Slug registrado: {$slug}

TXT;
}
