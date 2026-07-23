<?php

/**
 * Catálogo de updates (updates.json).
 *
 * Em produção o PHP fica em panel/lib/; no monorepo em panel/php/lib/.
 * Por isso a raiz do pacote do painel é detectada dinamicamente.
 */

/** Raiz do pacote panel/ (contém data/, lib/ ou php/, sites/). */
function platform_panel_package_root(): string
{
  static $root = null;
  if ($root !== null) {
    return $root;
  }

  // updates.php → …/lib ; pai = panel (prod) ou panel/php (monorepo)
  $libParent = dirname(__DIR__);

  // Preferir o ancestral que já tem data/updates/
  foreach ([$libParent, dirname($libParent)] as $candidate) {
    if (
      is_dir($candidate . '/data/updates')
      || is_file($candidate . '/data/updates/updates.json')
    ) {
      return $root = $candidate;
    }
  }

  // Produção sem data ainda: panel/lib → panel/ (tem sites/ ou SPA)
  if (basename($libParent) !== 'php') {
    if (is_dir($libParent . '/sites') || is_file($libParent . '/index.html')) {
      return $root = $libParent;
    }
  }

  // Monorepo: panel/php/lib → panel/
  if (basename($libParent) === 'php') {
    return $root = dirname($libParent);
  }

  if (defined('PLATFORM_ROOT') && PLATFORM_ROOT !== '') {
    $pr = rtrim(str_replace('\\', '/', PLATFORM_ROOT), '/');
    if (basename($pr) === 'sites') {
      return $root = dirname($pr);
    }
  }

  return $root = $libParent;
}

/**
 * @return list<string>
 */
function platform_updates_manifest_candidates(): array
{
  $candidates = [];

  if (defined('UPDATES_MANIFEST_PATH') && UPDATES_MANIFEST_PATH !== '') {
    $candidates[] = UPDATES_MANIFEST_PATH;
  }

  $panelRoot = platform_panel_package_root();
  $candidates[] = $panelRoot . '/data/updates/updates.json';

  // db.config em panel/php/ (dev) às vezes aponta errado — tentar irmãos comuns
  $candidates[] = dirname(__DIR__) . '/data/updates/updates.json';
  $candidates[] = dirname(__DIR__, 2) . '/data/updates/updates.json';

  if (defined('PLATFORM_ROOT') && PLATFORM_ROOT !== '') {
    $candidates[] = dirname(rtrim(PLATFORM_ROOT, '/\\')) . '/data/updates/updates.json';
  }

  // Dev monorepo
  $candidates[] = dirname($panelRoot) . '/dist/updates/updates.json';
  $candidates[] = dirname(__DIR__, 3) . '/dist/updates/updates.json';

  return array_values(array_unique($candidates));
}

/**
 * @return array<string, mixed>|null
 */
function platform_load_updates_manifest(): ?array
{
  foreach (platform_updates_manifest_candidates() as $path) {
    if (!is_file($path)) {
      continue;
    }
    $raw = json_decode((string) file_get_contents($path), true);
    if (is_array($raw) && !empty($raw['latest'])) {
      return $raw;
    }
  }

  return null;
}

/** Diretório onde ficam updates.json e os ZIPs. */
function platform_updates_dir(): string
{
  if (defined('UPDATES_DIR') && UPDATES_DIR !== '') {
    return rtrim(UPDATES_DIR, '/\\');
  }

  if (defined('UPDATES_MANIFEST_PATH') && UPDATES_MANIFEST_PATH !== '' && is_file(UPDATES_MANIFEST_PATH)) {
    return dirname(UPDATES_MANIFEST_PATH);
  }

  foreach (platform_updates_manifest_candidates() as $path) {
    if (is_file($path)) {
      return dirname($path);
    }
  }

  $dataDir = platform_panel_package_root() . '/data/updates';
  if (is_dir($dataDir)) {
    return $dataDir;
  }

  return $dataDir;
}

/** Mensagem de diagnóstico quando o catálogo não é encontrado. */
function platform_updates_catalog_missing_message(): string
{
  $tried = platform_updates_manifest_candidates();
  $lines = [
    'Catálogo de atualizações ausente (updates.json).',
    'Esperado em panel/data/updates/updates.json (ao lado de lib/ ou php/).',
    'Caminhos tentados:',
  ];
  foreach ($tried as $path) {
    $exists = is_file($path) ? 'arquivo' : (is_dir(dirname($path)) ? 'pasta ok, sem arquivo' : 'não existe');
    $lines[] = '  - ' . $path . ' (' . $exists . ')';
  }
  $lines[] = 'Rode make update-package / platform-core e suba panel/data/updates/ (updates.json + zip).';
  return implode(' ', $lines);
}

function platform_updates_download_ttl(): int
{
  if (defined('UPDATES_DOWNLOAD_TTL')) {
    $ttl = (int) UPDATES_DOWNLOAD_TTL;
    if ($ttl >= 60) {
      return $ttl;
    }
  }
  return 300; // 5 minutos
}

/**
 * Valida o nome do arquivo do pacote (só basename seguro).
 */
function platform_updates_safe_zip_name(string $name): ?string
{
  $normalized = str_replace('\\', '/', trim($name));
  if ($normalized === '' || str_contains($normalized, '/') || str_contains($normalized, '..')) {
    return null;
  }
  if (!preg_match('/^insta-bio-[0-9]+\.[0-9]+\.[0-9]+\.zip$/', $normalized)) {
    return null;
  }
  return $normalized;
}

/**
 * Resolve o caminho absoluto do ZIP a partir da entrada do manifesto.
 *
 * @param array<string, mixed> $package
 */
function platform_resolve_package_zip(array $package): ?string
{
  $url = (string) ($package['url'] ?? '');
  if ($url === '') {
    return null;
  }

  // url no manifesto é só o nome do arquivo (ex.: insta-bio-1.0.0.zip)
  $rawName = basename(parse_url($url, PHP_URL_PATH) ?: $url);
  $name = platform_updates_safe_zip_name($rawName);
  if ($name === null) {
    return null;
  }

  $path = platform_updates_dir() . DIRECTORY_SEPARATOR . $name;
  if (!is_file($path)) {
    return null;
  }

  return $path;
}

function platform_updates_signing_secret(): string
{
  if (!defined('APP_SECRET') || APP_SECRET === '' || APP_SECRET === 'troque-por-uma-chave-aleatoria-longa') {
    throw new RuntimeException('APP_SECRET não configurado para assinar downloads.');
  }
  return (string) APP_SECRET;
}

function platform_sign_update_download(string $filename, int $expires): string
{
  return hash_hmac('sha256', $filename . '|' . $expires, platform_updates_signing_secret());
}

function platform_verify_update_download(string $filename, int $expires, string $signature): bool
{
  if ($expires < time()) {
    return false;
  }
  $safe = platform_updates_safe_zip_name($filename);
  if ($safe === null) {
    return false;
  }
  if (!preg_match('/^[a-f0-9]{64}$/', $signature)) {
    return false;
  }
  $expected = platform_sign_update_download($safe, $expires);
  return hash_equals($expected, $signature);
}

function platform_update_download_public_url(string $filename, int $expires, string $signature): string
{
  $base = platform_public_base_url();
  $query = http_build_query([
    'file' => $filename,
    'expires' => $expires,
    'signature' => $signature,
  ]);
  return $base . '/panel/api/updates/download?' . $query;
}

/**
 * Grava editor/update-state.json após sync do template.
 *
 * @param array<string, mixed>|null $previousState
 */
function platform_write_editor_update_state(
  string $editorDir,
  string $version,
  ?array $previousState = null
): void {
  if (!is_dir($editorDir)) {
    platform_ensure_directory($editorDir);
  }

  $previousVersion = null;
  $channel = 'stable';
  if (is_array($previousState)) {
    $previousVersion = isset($previousState['version']) ? (string) $previousState['version'] : null;
    $channel = (string) ($previousState['channel'] ?? 'stable');
  }

  $state = [
    'version' => $version,
    'updatedAt' => date('c'),
    'channel' => $channel !== '' ? $channel : 'stable',
    'previousVersion' => $previousVersion,
  ];

  $target = rtrim($editorDir, '/\\') . DIRECTORY_SEPARATOR . 'update-state.json';
  file_put_contents(
    $target,
    json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n",
  );
}

/**
 * Lê a versão do manifesto de updates (fonte canônica) ou fallback do template/VERSION.
 */
function platform_latest_package_version(): string
{
  $manifest = platform_load_updates_manifest();
  if ($manifest !== null && !empty($manifest['latest'])) {
    return (string) $manifest['latest'];
  }
  return '0.0.0';
}

/**
 * Lê a versão do template (update-state.json do _template/editor) — fallback legado.
 */
function platform_template_version(string $templateDir): string
{
  $fromPackage = platform_latest_package_version();
  if ($fromPackage !== '0.0.0') {
    return $fromPackage;
  }

  $stateFile = rtrim($templateDir, '/\\') . '/editor/update-state.json';
  if (is_file($stateFile)) {
    $raw = json_decode((string) file_get_contents($stateFile), true);
    if (is_array($raw) && !empty($raw['version'])) {
      return (string) $raw['version'];
    }
  }

  $versionFile = dirname(__DIR__, 3) . '/VERSION';
  if (is_file($versionFile)) {
    $v = trim((string) file_get_contents($versionFile));
    if ($v !== '') {
      return $v;
    }
  }

  return '0.0.0';
}

/**
 * Bundle Vite: name-HASH.js|css (index, main, preview, EditorApp, icons, demo, …).
 * Não casa com imagens do cliente.
 */
function platform_is_bundle_filename(string $name): bool
{
  return preg_match('/^[A-Za-z0-9][A-Za-z0-9._]*-[A-Za-z0-9_-]{6,}\.(js|css)$/', $name) === 1;
}

function platform_is_editor_asset_bundle(string $name): bool
{
  return preg_match('/\.(js|css)(\.map)?$/i', $name) === 1;
}

function platform_remove_bundle_files(string $dir, bool $editorMode = false): void
{
  if (!is_dir($dir)) {
    return;
  }
  foreach (scandir($dir) ?: [] as $file) {
    if ($file === '.' || $file === '..') {
      continue;
    }
    $path = $dir . DIRECTORY_SEPARATOR . $file;
    if (!is_file($path)) {
      continue;
    }
    $match = $editorMode
      ? platform_is_editor_asset_bundle($file)
      : platform_is_bundle_filename($file);
    if ($match) {
      @unlink($path);
    }
  }
}

function platform_copy_file_mkdir(string $src, string $dest): void
{
  $dir = dirname($dest);
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  if (!@copy($src, $dest)) {
    throw new RuntimeException('Falha ao copiar: ' . $dest);
  }
}

/**
 * bio.json válido para cliente novo (sempre com brand.theme).
 * Nunca use shape legada { name, sections }.
 *
 * @return array<string, mixed>
 */
function platform_minimal_bio_config(string $clientName = 'Meu Link na Bio'): array
{
  $name = trim($clientName) !== '' ? trim($clientName) : 'Meu Link na Bio';
  $year = date('Y');

  return [
    'brand' => [
      'name' => $name,
      'tagline' => '',
      'location' => '',
      'instagram' => [
        'handle' => '',
        'url' => '',
      ],
      'socialLinks' => [
        [
          'network' => 'instagram',
          'url' => '',
        ],
      ],
      'logo' => '',
      'theme' => [
        'primary' => 'oklch(0.72 0.16 55)',
        'glow' => 'oklch(0.70 0.18 55 / 0.28)',
      ],
      'seo' => [
        'title' => $name,
        'description' => $name,
      ],
      'footer' => '© ' . $year . ' ' . $name,
    ],
    'sections' => [],
  ];
}

/**
 * @param array<string, mixed>|null $data
 */
function platform_bio_config_has_theme(?array $data): bool
{
  return is_array($data)
    && isset($data['brand'])
    && is_array($data['brand'])
    && isset($data['brand']['theme'])
    && is_array($data['brand']['theme'])
    && !empty($data['brand']['theme']['primary']);
}

/**
 * Garante bio.json válido no cliente (template do build ou fallback embutido).
 */
function platform_write_client_bio_json(string $clientDir, string $clientName = 'Meu Link na Bio'): void
{
  $bioDest = rtrim($clientDir, '/\\') . DIRECTORY_SEPARATOR . 'bio.json';
  $panelRoot = platform_panel_package_root();
  $repoRoot = dirname($panelRoot);

  $candidates = [
    $panelRoot . '/data/platform/_template/bio.json',
    $repoRoot . '/platform-template/_template/bio.json',
    $repoRoot . '/bio/public/bio.template.json',
    $repoRoot . '/bio/public/bio.default.json',
  ];

  if (defined('TEMPLATE_DIR') && is_string(TEMPLATE_DIR) && TEMPLATE_DIR !== '') {
    array_unshift($candidates, rtrim(TEMPLATE_DIR, '/\\') . '/bio.json');
  }

  foreach ($candidates as $candidate) {
    if (!is_file($candidate)) {
      continue;
    }
    $raw = json_decode((string) file_get_contents($candidate), true);
    if (!platform_bio_config_has_theme($raw)) {
      continue;
    }
    platform_copy_file_mkdir($candidate, $bioDest);
    return;
  }

  $json = json_encode(
    platform_minimal_bio_config($clientName),
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
  );
  if ($json === false || file_put_contents($bioDest, $json . "\n") === false) {
    throw new RuntimeException('Não foi possível gravar bio.json inicial do cliente.');
  }
}

/**
 * @return array{extractDir: string, version: string, cleanup: callable}
 */
function platform_extract_latest_update_package(): array
{
  if (!class_exists('ZipArchive')) {
    throw new RuntimeException('PHP ZipArchive não disponível no servidor.');
  }

  $manifest = platform_load_updates_manifest();
  if ($manifest === null) {
    throw new RuntimeException(platform_updates_catalog_missing_message());
  }

  $latest = (string) ($manifest['latest'] ?? '');
  $pkg = is_array($manifest['packages'][$latest] ?? null) ? $manifest['packages'][$latest] : null;
  if ($latest === '' || $pkg === null) {
    throw new RuntimeException('Nenhuma versão publicada no manifesto de updates.');
  }

  $zipPath = platform_resolve_package_zip($pkg);
  if ($zipPath === null) {
    throw new RuntimeException(
      'ZIP da versão ' . $latest . ' não encontrado em ' . platform_updates_dir(),
    );
  }

  $tempBase = sys_get_temp_dir();
  if (!is_writable($tempBase)) {
    $tempBase = dirname(__DIR__, 2) . '/data/updates/_tmp';
    if (!is_dir($tempBase)) {
      mkdir($tempBase, 0755, true);
    }
  }
  $tempDir = $tempBase . '/instabio_pkg_' . uniqid('', true);
  mkdir($tempDir, 0755, true);
  $extractDir = $tempDir . '/extracted';
  mkdir($extractDir, 0755, true);

  $zip = new ZipArchive();
  if ($zip->open($zipPath) !== true) {
    platform_remove_directory_tree($tempDir);
    throw new RuntimeException('Não foi possível abrir o ZIP de atualização.');
  }
  $zip->extractTo($extractDir);
  $zip->close();

  $manifestPath = $extractDir . '/manifest.json';
  if (!is_file($manifestPath)) {
    platform_remove_directory_tree($tempDir);
    throw new RuntimeException('Pacote inválido: manifest.json ausente.');
  }
  $inner = json_decode((string) file_get_contents($manifestPath), true);
  if (!is_array($inner) || ($inner['version'] ?? null) !== $latest) {
    platform_remove_directory_tree($tempDir);
    throw new RuntimeException('Pacote inválido: versão do manifesto interno não confere.');
  }
  if (!is_dir($extractDir . '/site') || !is_dir($extractDir . '/editor')) {
    platform_remove_directory_tree($tempDir);
    throw new RuntimeException('Pacote inválido: pastas site/ ou editor/ ausentes.');
  }

  return [
    'extractDir' => $extractDir,
    'version' => $latest,
    'cleanup' => static function () use ($tempDir): void {
      platform_remove_directory_tree($tempDir);
    },
  ];
}

function platform_remove_directory_tree(string $dir): void
{
  if (!is_dir($dir)) {
    return;
  }
  if (function_exists('platform_ensure_directory')) {
    // prefer shell-free recursive delete
  }
  $iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::CHILD_FIRST,
  );
  foreach ($iterator as $item) {
    if ($item->isDir()) {
      @rmdir($item->getPathname());
    } else {
      @unlink($item->getPathname());
    }
  }
  @rmdir($dir);
}

/**
 * Aplica site/ + editor/ do pacote extraído em um cliente (preserva dados).
 *
 * @param array<string, mixed>|null $previousState
 */
function platform_apply_extracted_package_to_client(
  string $clientDir,
  string $extractDir,
  string $version,
  ?array $previousState = null,
  bool $fullSiteAssets = false
): void {
  $siteSource = $extractDir . '/site';
  $editorSource = $extractDir . '/editor';
  $editorDir = rtrim($clientDir, '/\\') . '/editor';

  // Site: estáticos + todos os .php da raiz do pacote (gate) + bundles
  $staticFiles = ['index.html', 'favicon.svg', 'icons.svg', 'logo-instabio.svg', 'suspended.html', '.htaccess'];
  foreach (scandir($siteSource) ?: [] as $name) {
    if ($name === '.' || $name === '..' || $name === 'license.config.php') {
      continue;
    }
    if (!str_ends_with(strtolower($name), '.php')) {
      continue;
    }
    if (is_file($siteSource . '/' . $name)) {
      $staticFiles[] = $name;
    }
  }
  $staticFiles = array_values(array_unique($staticFiles));
  foreach ($staticFiles as $file) {
    $src = $siteSource . '/' . $file;
    if (is_file($src)) {
      platform_copy_file_mkdir($src, rtrim($clientDir, '/\\') . '/' . $file);
    }
  }

  $srcAssets = $siteSource . '/assets';
  $dstAssets = rtrim($clientDir, '/\\') . '/assets';
  if (is_dir($srcAssets)) {
    if (!is_dir($dstAssets)) {
      mkdir($dstAssets, 0755, true);
    }
    platform_remove_bundle_files($dstAssets);
    foreach (scandir($srcAssets) ?: [] as $file) {
      if ($file === '.' || $file === '..') {
        continue;
      }
      $src = $srcAssets . '/' . $file;
      if (!is_file($src)) {
        continue;
      }
      if ($fullSiteAssets || platform_is_bundle_filename($file)) {
        platform_copy_file_mkdir($src, $dstAssets . '/' . $file);
      }
    }
  }

  // Editor: tudo exceto sensíveis
  $editorSkip = [
    'auth.config.php',
    'platform-api.json',
    'update-state.json',
    'update.log',
    'update.log.1',
    '.update-tmp',
    '.update-backup',
  ];
  if (is_dir($editorSource)) {
    platform_remove_bundle_files($editorDir . '/assets', true);
    if (!function_exists('copy_directory_except_basenames')) {
      require_once __DIR__ . '/platform.php';
    }
    copy_directory_except_basenames($editorSource, $editorDir, $editorSkip);
  }

  platform_write_editor_update_state($editorDir, $version, $previousState);
}

/**
 * Materializa um cliente novo a partir do ZIP (fonte única).
 * Não grava auth/licença — o caller faz isso.
 *
 * @return array{version: string, path: string}
 */
function platform_materialize_client_from_package(string $clientDir): array
{
  $pkg = platform_extract_latest_update_package();
  try {
    if (is_dir($clientDir)) {
      throw new RuntimeException('Já existe uma pasta com este slug');
    }
    mkdir($clientDir, 0755, true);

    platform_apply_extracted_package_to_client(
      $clientDir,
      $pkg['extractDir'],
      $pkg['version'],
      null,
      true,
    );

    // bio.json mínimo válido (não vem no ZIP de update)
    platform_write_client_bio_json($clientDir, 'Meu Link na Bio');

    return [
      'version' => $pkg['version'],
      'path' => $clientDir,
    ];
  } finally {
    ($pkg['cleanup'])();
  }
}
