<?php

require_once dirname(__DIR__) . '/reserved-slugs.php';

function normalize_slug(string $input): string
{
  $value = strtolower(trim($input));
  $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
  $value = preg_replace('/[^a-z0-9-]+/', '-', $value) ?? '';
  $value = preg_replace('/-+/', '-', $value) ?? '';
  return trim($value, '-');
}

function validate_slug(string $slug): ?string
{
  $value = normalize_slug($slug);
  $reserved = require dirname(__DIR__) . '/reserved-slugs.php';

  if (strlen($value) < 3) {
    return 'Slug deve ter pelo menos 3 caracteres';
  }
  if (strlen($value) > 40) {
    return 'Slug deve ter no máximo 40 caracteres';
  }
  if (!preg_match('/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/', $value)) {
    return 'Use apenas letras minúsculas, números e hífen';
  }
  if (in_array($value, $reserved, true)) {
    return 'Este slug está reservado pelo sistema';
  }

  return null;
}

function generate_password(int $length = 12): string
{
  $chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  $max = strlen($chars) - 1;
  $password = '';
  for ($i = 0; $i < $length; $i++) {
    $password .= $chars[random_int(0, $max)];
  }
  return $password;
}

function copy_directory(string $src, string $dest): void
{
  if (!is_dir($src)) {
    throw new RuntimeException('Pasta template não encontrada: ' . $src);
  }

  platform_ensure_directory($dest);

  $iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST,
  );

  foreach ($iterator as $item) {
    $target = $dest . DIRECTORY_SEPARATOR . $iterator->getSubPathName();
    if ($item->isDir()) {
      platform_ensure_directory($target);
    } else {
      if (!@copy($item->getPathname(), $target)) {
        throw new RuntimeException('Falha ao copiar arquivo: ' . $target);
      }
    }
  }
}

function platform_ensure_directory(string $dir): void
{
  if (is_dir($dir)) {
    return;
  }

  if (@mkdir($dir, 0755, true) || is_dir($dir)) {
    return;
  }

  $basedir = ini_get('open_basedir');
  $hint = $basedir !== false && $basedir !== ''
    ? ' open_basedir=' . $basedir
    : '';
  throw new RuntimeException('Não foi possível criar pasta: ' . $dir . '.' . $hint);
}

/** Verifica se o servidor consegue provisionar clientes (pastas + escrita). */
function platform_provision_check(string $platformRoot, string $templateDir): array
{
  $result = [
    'ok' => false,
    'platform_root' => $platformRoot,
    'template_dir' => $templateDir,
    'open_basedir' => ini_get('open_basedir') ?: null,
    'checks' => [],
  ];

  $add = static function (string $name, bool $pass, string $detail = '') use (&$result): void {
    $result['checks'][] = ['name' => $name, 'ok' => $pass, 'detail' => $detail];
  };

  $add('template_exists', is_dir($templateDir), is_dir($templateDir) ? 'ok' : 'Pasta _template ausente na raiz do site');
  $add(
    'template_index',
    is_file($templateDir . '/index.html'),
    is_file($templateDir . '/index.html') ? 'ok' : 'index.html não encontrado no template',
  );

  $templateAssets = $templateDir . '/assets';
  $bundleCount = 0;
  if (is_dir($templateAssets)) {
    foreach (scandir($templateAssets) ?: [] as $file) {
      if ($file === '.' || $file === '..') {
        continue;
      }
      if (preg_match('/\.(js|css|mjs)$/i', $file)) {
        $bundleCount++;
      }
    }
  }
  $add(
    'template_bundles',
    $bundleCount > 0,
    $bundleCount > 0
      ? $bundleCount . ' bundle(s) em _template/assets'
      : 'Sem JS/CSS em _template/assets — rode npm run build:platform e suba _template/ completo',
  );

  $editorPreview = $templateDir . '/editor/preview.html';
  $add(
    'template_editor_preview',
    is_file($editorPreview),
    is_file($editorPreview) ? 'ok' : 'Falta editor/preview.html — preview ao vivo não funciona',
  );

  try {
    platform_ensure_directory($platformRoot);
    $add('mkdir_platform_root', true, $platformRoot);
  } catch (Throwable $e) {
    $add('mkdir_platform_root', false, $e->getMessage());
    return $result;
  }

  $probe = $platformRoot . DIRECTORY_SEPARATOR . '.probe-' . bin2hex(random_bytes(4));
  try {
    platform_ensure_directory($probe);
    $wrote = file_put_contents($probe . '/write-test.txt', 'ok') !== false;
    $add('write_file', $wrote, $wrote ? 'ok' : 'Sem permissão de escrita');
    $ht = file_put_contents($probe . '/.htaccess', "# probe\n") !== false;
    $add('write_htaccess', $ht, $ht ? 'ok' : 'Não foi possível gravar .htaccess');
    remove_directory($probe);
  } catch (Throwable $e) {
    $add('write_probe', false, $e->getMessage());
    if (is_dir($probe)) {
      remove_directory($probe);
    }
    return $result;
  }

  $result['ok'] = !in_array(false, array_column($result['checks'], 'ok'), true);
  return $result;
}

function write_editor_paths_config(string $editorDir): void
{
  if (file_put_contents($editorDir . DIRECTORY_SEPARATOR . 'auth.config.php', editor_paths_config_content()) === false) {
    throw new RuntimeException('Não foi possível gravar auth.config.php');
  }

  require_once __DIR__ . '/bio-path.php';
  $clientRoot = dirname($editorDir);
  write_bio_path_json($clientRoot, $clientRoot . DIRECTORY_SEPARATOR . 'bio.json');
}

function editor_paths_config_content(): string
{
  return <<<'PHP'
<?php
// Caminhos do editor — credenciais vêm do painel via API.
define('BIO_JSON_PATH', __DIR__ . '/../bio.json');
define('ASSETS_DIR', __DIR__ . '/../assets');

PHP;
}

function platform_parse_auth_bio_json_path(string $authFile): ?string
{
  if (!is_file($authFile)) {
    return null;
  }

  $content = file_get_contents($authFile);
  if ($content === false) {
    return null;
  }

  if (preg_match("/define\\('BIO_JSON_PATH',\\s*__DIR__\\s*\\.\\s*'([^']+)'\\)/", $content, $matches)) {
    $path = dirname($authFile) . $matches[1];
    $real = realpath($path);
    return $real !== false ? $real : $path;
  }

  if (preg_match("/define\\('BIO_JSON_PATH',\\s*'([^']+)'\\)/", $content, $matches)) {
    return $matches[1];
  }

  return null;
}

/** @deprecated Credenciais agora vêm da API do painel; grava só os caminhos. */
function write_client_auth_config(string $editorDir, string $email = '', string $passwordHash = ''): void
{
  write_editor_paths_config($editorDir);
}

function update_client_password(string $platformRoot, string $slug, string $email, string $passwordHash): void
{
  $editorDir = rtrim($platformRoot, '/\\') . DIRECTORY_SEPARATOR . $slug . DIRECTORY_SEPARATOR . 'editor';
  if (!is_dir($editorDir)) {
    throw new RuntimeException('Pasta do editor não encontrada para este cliente');
  }

  write_editor_paths_config($editorDir);
}

function write_client_htaccess(string $clientDir): void
{
  $content = <<<'HTACCESS'
# Links na Bio — bio pública do cliente (/{slug}/)
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

  # Cliente suspenso
  RewriteCond %{REQUEST_URI} !/suspended\.html$ [NC]
  RewriteCond .suspended -f
  RewriteRule ^ suspended.html [L]

  # /editor sem barra → /editor/
  RewriteRule ^editor$ editor/ [R=301,L]

  # Proxy de analytics (same-origin → painel no servidor)
  RewriteRule ^api/analytics/track$ index.php?__ib_analytics_track=1 [L,QSA]

  # Bio pública sempre passa pelo gate de licença
  RewriteRule ^index\.html$ index.php [L]
</IfModule>

# bio.json sempre fresco após publicar no editor
<Files "bio.json">
  <IfModule mod_headers.c>
    Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </IfModule>
</Files>

# Rascunho só pelo editor autenticado — não expor publicamente
<Files "bio.draft.json">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
</Files>
HTACCESS;

  if (file_put_contents($clientDir . DIRECTORY_SEPARATOR . '.htaccess', $content) === false) {
    throw new RuntimeException('Não foi possível gravar .htaccess do cliente');
  }
}

function sync_client_status(string $platformRoot, string $slug, string $status): void
{
  $clientDir = rtrim($platformRoot, '/\\') . DIRECTORY_SEPARATOR . normalize_slug($slug);
  if (!is_dir($clientDir)) {
    throw new RuntimeException('Pasta do cliente não encontrada');
  }

  $flag = $clientDir . DIRECTORY_SEPARATOR . '.suspended';
  if ($status === 'suspended') {
    if (file_put_contents($flag, date('c') . "\n") === false) {
      throw new RuntimeException('Não foi possível marcar cliente como suspenso');
    }
    return;
  }

  if (file_exists($flag)) {
    unlink($flag);
  }
}

function client_read_bio_file(string $path): ?array
{
  if (!is_file($path)) {
    return null;
  }

  $raw = file_get_contents($path);
  if ($raw === false || $raw === '') {
    return null;
  }

  $data = json_decode($raw, true);
  return is_array($data) ? $data : null;
}

function client_bio_has_content(?array $data): bool
{
  if ($data === null) {
    return false;
  }

  if (!empty($data['sections']) && is_array($data['sections']) && count($data['sections']) > 0) {
    return true;
  }

  $brand = $data['brand'] ?? [];
  if (!is_array($brand)) {
    return false;
  }

  foreach (['logo', 'tagline', 'location', 'coverImage'] as $key) {
    if (!empty($brand[$key])) {
      return true;
    }
  }

  return false;
}

/**
 * @return array{content: string, source: 'published'|'draft'}
 */
function client_resolve_export_bio(string $clientDir): array
{
  $publishedPath = rtrim($clientDir, '/\\') . DIRECTORY_SEPARATOR . 'bio.json';
  $draftPath = rtrim($clientDir, '/\\') . DIRECTORY_SEPARATOR . 'bio.draft.json';

  $published = client_read_bio_file($publishedPath);
  $draft = client_read_bio_file($draftPath);

  if (client_bio_has_content($published)) {
    $chosen = $published;
    $source = 'published';
  } elseif (client_bio_has_content($draft)) {
    $chosen = $draft;
    $source = 'draft';
  } elseif ($published !== null) {
    $chosen = $published;
    $source = 'published';
  } elseif ($draft !== null) {
    $chosen = $draft;
    $source = 'draft';
  } else {
    throw new RuntimeException(
      'Nenhuma configuração da bio encontrada. Edite e publique a bio no editor antes de exportar.',
    );
  }

  $json = json_encode(
    $chosen,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
  );
  if ($json === false) {
    throw new RuntimeException('Não foi possível serializar a bio para exportação.');
  }

  return [
    'content' => $json . "\n",
    'source' => $source,
  ];
}

function customize_bio_json(string $bioPath, string $clientName, string $slug): void
{
  if (!file_exists($bioPath)) {
    require_once __DIR__ . '/updates.php';
    platform_write_client_bio_json(dirname($bioPath), $clientName);
  }

  $data = json_decode((string) file_get_contents($bioPath), true);
  if (!is_array($data)) {
    throw new RuntimeException('bio.json inválido no template');
  }

  require_once __DIR__ . '/updates.php';
  if (!platform_bio_config_has_theme($data)) {
    $data = platform_minimal_bio_config($clientName);
  }

  $data['brand']['name'] = $clientName;
  $data['brand']['footer'] = '© ' . date('Y') . ' ' . $clientName;
  $data['brand']['tagline'] = '';
  $data['brand']['location'] = '';
  $data['brand']['logo'] = '';
  if (isset($data['brand']['seo']) && is_array($data['brand']['seo'])) {
    $data['brand']['seo']['title'] = $clientName;
    $data['brand']['seo']['description'] = $clientName;
  }
  if (isset($data['brand']['instagram']) && is_array($data['brand']['instagram'])) {
    $data['brand']['instagram']['handle'] = '';
    $data['brand']['instagram']['url'] = '';
  }
  unset($data['brand']['coverImage']);
  $data['sections'] = [];
  unset($data['name']); // remove chave legada inválida, se houver

  $json = json_encode(
    $data,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
  );

  if ($json === false || file_put_contents($bioPath, $json . "\n") === false) {
    throw new RuntimeException('Não foi possível personalizar bio.json');
  }
}

function count_build_bundles(string $assetsDir): int
{
  if (!is_dir($assetsDir)) {
    return 0;
  }

  $count = 0;
  foreach (scandir($assetsDir) ?: [] as $file) {
    if ($file === '.' || $file === '..') {
      continue;
    }
    if (preg_match('/\.(js|css|mjs)$/i', $file)) {
      $count++;
    }
  }

  return $count;
}

function assert_client_has_bundles(string $clientDir): void
{
  $bioBundles = count_build_bundles($clientDir . DIRECTORY_SEPARATOR . 'assets');
  if ($bioBundles === 0) {
    throw new RuntimeException(
      'Template inválido: _template/assets sem bundles JS/CSS. Rode npm run build:platform e suba a pasta _template/ completa.',
    );
  }

  $editorBundles = count_build_bundles($clientDir . DIRECTORY_SEPARATOR . 'editor' . DIRECTORY_SEPARATOR . 'assets');
  if ($editorBundles === 0) {
    throw new RuntimeException(
      'Template inválido: _template/editor/assets sem bundles JS/CSS.',
    );
  }
}

function is_build_bundle_filename(string $name): bool
{
  // Vite: name-HASH.js|css (index, EditorApp, icons, preview, demo, …)
  return (bool) preg_match('/^[A-Za-z0-9][A-Za-z0-9._]*-[A-Za-z0-9_-]{6,}\.(js|css)$/', $name);
}

function is_editor_asset_bundle_filename(string $name): bool
{
  return (bool) preg_match('/\.(js|css)(\.map)?$/i', $name);
}

function copy_file_if_exists(string $src, string $dest): void
{
  if (!is_file($src)) {
    return;
  }

  platform_ensure_directory(dirname($dest));
  if (!@copy($src, $dest)) {
    throw new RuntimeException('Falha ao copiar arquivo: ' . $dest);
  }
}

function remove_build_bundle_files(string $assetsDir, bool $editorMode = false): void
{
  if (!is_dir($assetsDir)) {
    return;
  }

  foreach (scandir($assetsDir) ?: [] as $file) {
    if ($file === '.' || $file === '..') {
      continue;
    }
    $full = $assetsDir . DIRECTORY_SEPARATOR . $file;
    if (!is_file($full)) {
      continue;
    }
    $match = $editorMode
      ? is_editor_asset_bundle_filename($file)
      : is_build_bundle_filename($file);
    if ($match) {
      unlink($full);
    }
  }
}

function sync_client_bio_from_template(string $clientDir, string $templateDir): void
{
  foreach (['index.html', 'suspended.html', 'favicon.svg', 'icons.svg', 'logo-instabio.svg'] as $name) {
    copy_file_if_exists(
      $templateDir . DIRECTORY_SEPARATOR . $name,
      $clientDir . DIRECTORY_SEPARATOR . $name,
    );
  }

  $tplAssets = $templateDir . DIRECTORY_SEPARATOR . 'assets';
  $dstAssets = $clientDir . DIRECTORY_SEPARATOR . 'assets';
  platform_ensure_directory($dstAssets);
  remove_build_bundle_files($dstAssets);

  if (!is_dir($tplAssets)) {
    return;
  }

  foreach (scandir($tplAssets) ?: [] as $file) {
    if ($file === '.' || $file === '..') {
      continue;
    }
    if (!is_build_bundle_filename($file)) {
      continue;
    }
    copy_file_if_exists($tplAssets . DIRECTORY_SEPARATOR . $file, $dstAssets . DIRECTORY_SEPARATOR . $file);
  }
}

function copy_directory_except_basenames(string $src, string $dest, array $skipBasenames): void
{
  if (!is_dir($src)) {
    throw new RuntimeException('Pasta template não encontrada: ' . $src);
  }

  $skip = array_flip($skipBasenames);
  platform_ensure_directory($dest);

  $iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST,
  );

  foreach ($iterator as $item) {
    $relative = $iterator->getSubPathName();
    if (isset($skip[basename($relative)])) {
      continue;
    }

    $target = $dest . DIRECTORY_SEPARATOR . $relative;
    if ($item->isDir()) {
      platform_ensure_directory($target);
      continue;
    }

    platform_ensure_directory(dirname($target));
    if (!@copy($item->getPathname(), $target)) {
      throw new RuntimeException('Falha ao copiar arquivo: ' . $target);
    }
  }
}

function sync_client_editor_from_template(string $clientDir, string $templateDir): void
{
  $tplEditor = $templateDir . DIRECTORY_SEPARATOR . 'editor';
  $dstEditor = $clientDir . DIRECTORY_SEPARATOR . 'editor';
  if (!is_dir($tplEditor)) {
    return;
  }

  remove_build_bundle_files($dstEditor . DIRECTORY_SEPARATOR . 'assets', true);
  copy_directory_except_basenames($tplEditor, $dstEditor, ['auth.config.php']);
}

/** Atualiza um cliente a partir do ZIP de updates (preserva bio, imagens, auth). */
function sync_client_from_update_package(string $clientDir, string $extractDir, string $version): void
{
  $editorDir = $clientDir . DIRECTORY_SEPARATOR . 'editor';
  $previousState = null;
  $stateFile = $editorDir . DIRECTORY_SEPARATOR . 'update-state.json';
  if (is_file($stateFile)) {
    $raw = json_decode((string) file_get_contents($stateFile), true);
    if (is_array($raw)) {
      $previousState = $raw;
    }
  }

  if (!function_exists('platform_apply_extracted_package_to_client')) {
    require_once __DIR__ . '/updates.php';
  }

  platform_apply_extracted_package_to_client(
    $clientDir,
    $extractDir,
    $version,
    $previousState,
    false,
  );
  write_client_htaccess($clientDir);
  install_client_license_gate_files($clientDir);
}

/** Fallback legado: copia de _template/ (preferir ZIP). */
function sync_client_from_template(string $clientDir, string $templateDir): void
{
  $editorDir = $clientDir . DIRECTORY_SEPARATOR . 'editor';
  $previousState = null;
  $stateFile = $editorDir . DIRECTORY_SEPARATOR . 'update-state.json';
  if (is_file($stateFile)) {
    $raw = json_decode((string) file_get_contents($stateFile), true);
    if (is_array($raw)) {
      $previousState = $raw;
    }
  }

  sync_client_bio_from_template($clientDir, $templateDir);
  sync_client_editor_from_template($clientDir, $templateDir);
  write_client_htaccess($clientDir);
  install_client_license_gate_files($clientDir);

  if (!function_exists('platform_write_editor_update_state')) {
    require_once __DIR__ . '/updates.php';
  }
  platform_write_editor_update_state(
    $editorDir,
    platform_template_version($templateDir),
    $previousState,
  );
}

/**
 * Propaga o ZIP de updates para todos os clientes (fonte única).
 *
 * @return array{
 *   ok: bool,
 *   source: string,
 *   version: string,
 *   template_dir: string,
 *   platform_root: string,
 *   updated: list<array{id: int, slug: string, name: string}>,
 *   skipped: list<array{slug: string, reason: string}>,
 *   errors: list<array{slug: string, error: string}>
 * }
 */
function sync_all_clients_from_template(PDO $pdo, string $platformRoot, string $templateDir): array
{
  require_once __DIR__ . '/updates.php';
  require_once __DIR__ . '/license.php';

  $pkg = platform_extract_latest_update_package();
  $version = $pkg['version'];
  $extractDir = $pkg['extractDir'];

  $result = [
    'ok' => true,
    'source' => 'update-package',
    'version' => $version,
    'template_dir' => $templateDir,
    'platform_root' => $platformRoot,
    'updated' => [],
    'skipped' => [],
    'errors' => [],
  ];

  try {
    $stmt = $pdo->query(
      'SELECT id, slug, name, email, password_hash, status, license_token FROM clients ORDER BY slug ASC',
    );
    $clients = $stmt->fetchAll();

    foreach ($clients as $client) {
      $slug = normalize_slug((string) $client['slug']);
      $clientDir = rtrim($platformRoot, '/\\') . DIRECTORY_SEPARATOR . $slug;

      if (!is_dir($clientDir)) {
        $result['skipped'][] = [
          'slug' => $slug,
          'reason' => 'Pasta do cliente não encontrada',
        ];
        continue;
      }

      try {
        sync_client_from_update_package($clientDir, $extractDir, $version);
        sync_client_license_files($pdo, $platformRoot, $client);
        $result['updated'][] = [
          'id' => (int) $client['id'],
          'slug' => $slug,
          'name' => (string) $client['name'],
        ];
      } catch (Throwable $e) {
        $result['errors'][] = [
          'slug' => $slug,
          'error' => $e->getMessage(),
        ];
        $result['ok'] = false;
      }
    }
  } finally {
    ($pkg['cleanup'])();
  }

  return $result;
}

function remove_directory(string $dir): void
{
  if (!is_dir($dir)) {
    return;
  }

  $iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::CHILD_FIRST,
  );

  foreach ($iterator as $item) {
    if ($item->isDir()) {
      rmdir($item->getPathname());
    } else {
      unlink($item->getPathname());
    }
  }

  rmdir($dir);
}

function provision_client(
  string $platformRoot,
  string $templateDir,
  string $slug,
  string $name,
  string $email,
  string $passwordHash,
  string $licenseToken,
  string $platformBaseUrl,
): array
{
  $error = validate_slug($slug);
  if ($error !== null) {
    throw new InvalidArgumentException($error);
  }

  $slug = normalize_slug($slug);
  $clientDir = rtrim($platformRoot, '/\\') . DIRECTORY_SEPARATOR . $slug;

  if (is_dir($clientDir)) {
    throw new RuntimeException('Já existe uma pasta com este slug');
  }

  require_once __DIR__ . '/updates.php';

  // Fonte única: ZIP. Fallback legado para _template se o pacote não existir.
  try {
    platform_materialize_client_from_package($clientDir);
  } catch (Throwable $e) {
    if (!is_dir($templateDir)) {
      throw new RuntimeException(
        'Pacote de updates indisponível e _template ausente. ' . $e->getMessage(),
        0,
        $e,
      );
    }
    copy_directory($templateDir, $clientDir);
  }

  assert_client_has_bundles($clientDir);

  write_client_htaccess($clientDir);

  $bioPath = $clientDir . DIRECTORY_SEPARATOR . 'bio.json';
  $bioRaw = is_file($bioPath) ? json_decode((string) file_get_contents($bioPath), true) : null;
  if (!function_exists('platform_bio_config_has_theme') || !platform_bio_config_has_theme(is_array($bioRaw) ? $bioRaw : null)) {
    require_once __DIR__ . '/updates.php';
    platform_write_client_bio_json($clientDir, $name);
  }
  customize_bio_json($bioPath, $name, $slug);

  $editorDir = $clientDir . DIRECTORY_SEPARATOR . 'editor';
  write_client_auth_config($editorDir, $email, $passwordHash);
  install_client_license_gate_files($clientDir);

  $version = platform_latest_package_version();
  if ($version === '0.0.0') {
    $version = platform_template_version($templateDir);
  }
  platform_write_editor_update_state($editorDir, $version, null);

  return [
    'slug' => $slug,
    'path' => $clientDir,
    'bio_url' => '/' . $slug . '/',
    'editor_url' => '/' . $slug . '/editor/',
  ];
}

function update_client(
  PDO $pdo,
  string $platformRoot,
  int $id,
  string $name,
  string $email,
  string $slugInput,
  bool $selfHosted = false,
  string $allowedHostInput = '',
  string $deployPathInput = '',
): array {
  $name = trim($name);
  $email = strtolower(trim($email));
  $newSlug = normalize_slug($slugInput);

  if ($name === '' || $email === '') {
    throw new InvalidArgumentException('Nome e e-mail são obrigatórios');
  }

  $slugError = validate_slug($newSlug);
  if ($slugError !== null) {
    throw new InvalidArgumentException($slugError);
  }

  require_once __DIR__ . '/license.php';
  $hosting = resolve_client_hosting_input($selfHosted, $allowedHostInput, $deployPathInput);

  $stmt = platform_db_execute($pdo, 'SELECT * FROM clients WHERE id = ? LIMIT 1', [$id]);
  $client = $stmt->fetch();
  if (!$client) {
    throw new RuntimeException('Cliente não encontrado');
  }

  $oldSlug = $client['slug'];

  if ($newSlug !== $oldSlug) {
    $check = platform_db_execute(
      $pdo,
      'SELECT id FROM clients WHERE slug = ? AND id != ? LIMIT 1',
      [$newSlug, $id],
    );
    if ($check->fetch()) {
      throw new InvalidArgumentException('Este slug já está em uso');
    }
  }

  if (strtolower($email) !== strtolower($client['email'])) {
    $checkEmail = platform_db_execute(
      $pdo,
      'SELECT id FROM clients WHERE email = ? AND id != ? LIMIT 1',
      [$email, $id],
    );
    if ($checkEmail->fetch()) {
      throw new InvalidArgumentException('Este e-mail já está em uso');
    }
  }

  $oldDir = rtrim($platformRoot, '/\\') . DIRECTORY_SEPARATOR . $oldSlug;
  $newDir = rtrim($platformRoot, '/\\') . DIRECTORY_SEPARATOR . $newSlug;

  if (!is_dir($oldDir)) {
    throw new RuntimeException('Pasta do cliente não encontrada');
  }

  if ($newSlug !== $oldSlug) {
    if (is_dir($newDir)) {
      throw new RuntimeException('Já existe uma pasta com o novo slug');
    }
    if (!rename($oldDir, $newDir)) {
      throw new RuntimeException('Não foi possível renomear a pasta do cliente');
    }
    $clientDir = $newDir;
  } else {
    $clientDir = $oldDir;
  }

  customize_bio_json($clientDir . DIRECTORY_SEPARATOR . 'bio.json', $name, $newSlug);

  $editorDir = $clientDir . DIRECTORY_SEPARATOR . 'editor';
  write_client_auth_config($editorDir, $email, $client['password_hash']);

  $client['slug'] = $newSlug;
  $client['self_hosted'] = $hosting['self_hosted'] ? 1 : 0;
  $client['allowed_host'] = $hosting['allowed_host'];
  $client['deploy_path'] = $hosting['deploy_path'];
  sync_client_license_files($pdo, $platformRoot, $client);

  $update = platform_db_execute(
    $pdo,
    'UPDATE clients SET slug = ?, name = ?, email = ?, self_hosted = ?, allowed_host = ?, deploy_path = ?, updated_at = NOW() WHERE id = ?',
    [
      $newSlug,
      $name,
      $email,
      $hosting['self_hosted'] ? 1 : 0,
      $hosting['allowed_host'],
      $hosting['deploy_path'],
      $id,
    ],
  );

  return [
    'id' => $id,
    'slug' => $newSlug,
    'name' => $name,
    'email' => $email,
    'status' => $client['status'],
    'self_hosted' => $hosting['self_hosted'],
    'allowed_host' => $hosting['allowed_host'],
    'deploy_path' => $hosting['deploy_path'],
    'slug_changed' => $newSlug !== $oldSlug,
    'bio_url' => '/' . $newSlug . '/',
    'editor_url' => '/' . $newSlug . '/editor/',
  ];
}
