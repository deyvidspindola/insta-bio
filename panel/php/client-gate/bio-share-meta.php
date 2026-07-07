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

function bio_share_load_brand(string $clientRoot): ?array
{
  $bioPath = rtrim($clientRoot, '/\\') . DIRECTORY_SEPARATOR . 'bio.json';
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
  $brand = bio_share_load_brand($clientRoot);
  if ($brand === null) {
    return $html;
  }

  $publicBase = bio_share_public_base_url();
  $pageUrl = rtrim($publicBase, '/') . '/';

  return bio_share_inject_head($html, $brand, $publicBase, $pageUrl);
}
