<?php

function bio_share_escape(string $value): string
{
  return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function bio_share_page_title(array $brand): string
{
  $name = trim((string) ($brand['name'] ?? ''));
  return $name !== '' ? $name : 'Link na Bio';
}

function bio_share_page_description(array $brand): string
{
  $name = trim((string) ($brand['name'] ?? ''));
  $tagline = trim((string) ($brand['tagline'] ?? ''));

  if ($name !== '' && $tagline !== '') {
    return $name . '. ' . $tagline;
  }
  if ($name !== '') {
    return $name;
  }
  if ($tagline !== '') {
    return $tagline;
  }

  return 'Link na Bio';
}

function bio_share_public_base_url(): string
{
  $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
  $host = $_SERVER['HTTP_HOST'] ?? 'localhost';

  if (defined('LICENSE_SLUG') && LICENSE_SLUG !== '') {
    return $scheme . '://' . $host . '/' . LICENSE_SLUG;
  }

  $script = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? ''));
  $dir = rtrim(dirname($script), '/');
  if ($dir === '' || $dir === '.') {
    return $scheme . '://' . $host;
  }

  return $scheme . '://' . $host . $dir;
}

function bio_share_resolve_asset_url(string $path, string $publicBase): string
{
  $path = trim($path);
  if ($path === '') {
    return '';
  }
  if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
    return $path;
  }

  return rtrim($publicBase, '/') . '/' . ltrim($path, '/');
}

function bio_share_parse_auth_bio_json_path(string $authFile): ?string
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

function bio_share_json_relative_path(string $clientRoot): string
{
  $authFile = rtrim($clientRoot, '/\\') . '/editor/auth.config.php';
  $absolute = bio_share_parse_auth_bio_json_path($authFile);
  if ($absolute !== null && is_file($authFile)) {
    require_once dirname($authFile) . '/bio-path.php';
    if (function_exists('bio_path_to_relative')) {
      return bio_path_to_relative($absolute, $clientRoot);
    }
  }

  $bioPathJson = rtrim($clientRoot, '/\\') . '/bio-path.json';
  if (is_file($bioPathJson)) {
    $data = json_decode((string) file_get_contents($bioPathJson), true);
    if (is_array($data)) {
      $relative = trim((string) ($data['bioJsonPath'] ?? ''));
      if ($relative !== '') {
        return $relative;
      }
      $legacy = trim((string) ($data['bioJsonUrl'] ?? ''));
      if ($legacy !== '') {
        return ltrim($legacy, '/');
      }
    }
  }

  return 'bio.json';
}

function bio_share_inject_runtime(string $html, string $relativeBioPath): string
{
  $script = '    <script>window.__BIO_JSON_PATH__='
    . json_encode($relativeBioPath, JSON_UNESCAPED_SLASHES)
    . ";</script>\n";

  return preg_replace('/<\/head>/i', $script . '  </head>', $html, 1) ?? $html;
}

function bio_share_load_brand(string $clientRoot): ?array
{
  $authFile = rtrim($clientRoot, '/\\') . '/editor/auth.config.php';
  $bioPath = bio_share_parse_auth_bio_json_path($authFile);
  if ($bioPath === null) {
    $bioPath = rtrim($clientRoot, '/\\') . DIRECTORY_SEPARATOR . 'bio.json';
  }

  if (!is_file($bioPath)) {
    return null;
  }

  $data = json_decode((string) file_get_contents($bioPath), true);
  if (!is_array($data) || !isset($data['brand']) || !is_array($data['brand'])) {
    return null;
  }

  return $data['brand'];
}

function bio_share_favicon_tag(string $logoPath): string
{
  $path = trim($logoPath);
  if ($path === '') {
    return '';
  }

  if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
    return '<link rel="icon" href="' . bio_share_escape($path) . '" />';
  }

  return '<link rel="icon" href="./' . bio_share_escape(ltrim($path, '/')) . '" />';
}

function bio_share_inject_head(string $html, array $brand, string $publicBase, string $pageUrl): string
{
  $title = bio_share_page_title($brand);
  $description = bio_share_page_description($brand);
  $logo = trim((string) ($brand['logo'] ?? ''));
  $imageUrl = $logo !== '' ? bio_share_resolve_asset_url($logo, $publicBase) : '';

  $html = preg_replace(
    '/<title>.*?<\/title>/is',
    '<title>' . bio_share_escape($title) . '</title>',
    $html,
    1,
  ) ?? $html;

  $html = preg_replace(
    '/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i',
    '<meta name="description" content="' . bio_share_escape($description) . '" />',
    $html,
    1,
  ) ?? $html;

  if ($logo !== '') {
    $iconTag = bio_share_favicon_tag($logo);
    if (preg_match('/<link\s+rel="icon"[^>]*>/i', $html)) {
      $html = preg_replace('/<link\s+rel="icon"[^>]*>/i', $iconTag, $html, 1) ?? $html;
    } else {
      $html = preg_replace('/<\/head>/i', '    ' . $iconTag . "\n  </head>", $html, 1) ?? $html;
    }
  }

  $ogTags = "\n    <meta property=\"og:type\" content=\"website\" />\n";
  $ogTags .= '    <meta property="og:url" content="' . bio_share_escape($pageUrl) . '" />' . "\n";
  $ogTags .= '    <meta property="og:title" content="' . bio_share_escape($title) . '" />' . "\n";
  $ogTags .= '    <meta property="og:description" content="' . bio_share_escape($description) . '" />' . "\n";
  $ogTags .= '    <meta property="og:locale" content="pt_BR" />' . "\n";

  if ($imageUrl !== '') {
    $ogTags .= '    <meta property="og:image" content="' . bio_share_escape($imageUrl) . '" />' . "\n";
    $ogTags .= '    <meta name="twitter:card" content="summary_large_image" />' . "\n";
    $ogTags .= '    <meta name="twitter:image" content="' . bio_share_escape($imageUrl) . '" />' . "\n";
  } else {
    $ogTags .= '    <meta name="twitter:card" content="summary" />' . "\n";
  }

  $ogTags .= '    <meta name="twitter:title" content="' . bio_share_escape($title) . '" />' . "\n";
  $ogTags .= '    <meta name="twitter:description" content="' . bio_share_escape($description) . '" />' . "\n";

  $html = preg_replace('/<\/head>/i', $ogTags . '  </head>', $html, 1) ?? $html;

  return $html;
}

function bio_share_render_index(string $clientRoot, string $indexPath): string
{
  $html = (string) file_get_contents($indexPath);
  $relativeBioPath = bio_share_json_relative_path($clientRoot);
  $html = bio_share_inject_runtime($html, $relativeBioPath);

  $brand = bio_share_load_brand($clientRoot);
  if ($brand === null) {
    return $html;
  }

  $publicBase = bio_share_public_base_url();
  $pageUrl = rtrim($publicBase, '/') . '/';

  return bio_share_inject_head($html, $brand, $publicBase, $pageUrl);
}
