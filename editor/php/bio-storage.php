<?php
/**
 * Rascunho vs publicado:
 * - BIO_JSON_PATH     → bio pública (visitantes)
 * - bio.draft.json    → rascunho do editor (Salvar)
 */

function bio_published_path(): string
{
  return BIO_JSON_PATH;
}

function bio_draft_path(): string
{
  if (defined('BIO_DRAFT_JSON_PATH')) {
    return BIO_DRAFT_JSON_PATH;
  }
  return dirname(BIO_JSON_PATH) . '/bio.draft.json';
}

function bio_read_json(string $path): ?array
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

function bio_write_json(string $path, array $data): bool
{
  $pretty = json_encode(
    $data,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
  );
  if ($pretty === false) {
    return false;
  }
  $dir = dirname($path);
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  return file_put_contents($path, $pretty . "\n") !== false;
}

function bio_json_uses_asset(?string $json, string $filename): bool
{
  if ($json === null || $json === '') {
    return false;
  }
  $needles = [$filename, 'assets/' . $filename, '/assets/' . $filename];
  foreach ($needles as $needle) {
    if (strpos($json, $needle) !== false) {
      return true;
    }
  }
  return false;
}

function bio_any_config_uses_asset(string $filename): bool
{
  foreach ([bio_published_path(), bio_draft_path()] as $path) {
    if (!is_file($path)) {
      continue;
    }
    $json = file_get_contents($path);
    if ($json !== false && bio_json_uses_asset($json, $filename)) {
      return true;
    }
  }
  return false;
}

function bio_load_for_editor(): array
{
  $published = bio_read_json(bio_published_path());
  $draft = bio_read_json(bio_draft_path());

  if ($draft !== null) {
    return [
      'config' => $draft,
      'source' => 'draft',
      'hasDraft' => true,
      'published' => $published,
    ];
  }

  if ($published !== null) {
    return [
      'config' => $published,
      'source' => 'published',
      'hasDraft' => false,
      'published' => $published,
    ];
  }

  return [
    'config' => null,
    'source' => 'none',
    'hasDraft' => false,
    'published' => null,
  ];
}
