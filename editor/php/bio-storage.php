<?php
/**
 * Rascunho vs publicado:
 * - BIO_JSON_PATH     → bio pública (visitantes)
 * - bio.draft.json    → rascunho do editor (Salvar)
 * - bio.json.bak      → última bio publicada antes da publicação atual
 * - bio.backups/      → histórico (até BIO_BACKUP_KEEP arquivos)
 */

/** Quantos backups com timestamp manter em bio.backups/. */
const BIO_BACKUP_KEEP = 10;

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

/** Cópia da bio publicada imediatamente anterior à última publicação. */
function bio_backup_path(): string
{
  return dirname(BIO_JSON_PATH) . '/bio.json.bak';
}

function bio_backups_dir(): string
{
  return dirname(BIO_JSON_PATH) . '/bio.backups';
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

/**
 * Antes de sobrescrever bio.json: grava bio.json.bak + snapshot em bio.backups/.
 * Sem bio publicada ainda → no-op (ok).
 */
function bio_backup_before_publish(): bool
{
  $published = bio_published_path();
  if (!is_file($published)) {
    return true;
  }

  $bak = bio_backup_path();
  if (!@copy($published, $bak)) {
    return false;
  }

  $dir = bio_backups_dir();
  if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
    // bak já foi gravado — histórico é best-effort
    return true;
  }

  $htaccess = $dir . '/.htaccess';
  if (!is_file($htaccess)) {
    @file_put_contents($htaccess, "Require all denied\n");
  }

  $stamp = date('Ymd_His');
  $target = $dir . '/bio-' . $stamp . '.json';
  if (is_file($target)) {
    $target = $dir . '/bio-' . $stamp . '-' . substr((string) microtime(true), -4) . '.json';
  }
  @copy($published, $target);

  bio_prune_backups($dir, BIO_BACKUP_KEEP);

  return true;
}

function bio_prune_backups(string $dir, int $keep): void
{
  $files = glob($dir . '/bio-*.json');
  if ($files === false || count($files) <= $keep) {
    return;
  }
  usort($files, static function (string $a, string $b): int {
    return filemtime($b) <=> filemtime($a);
  });
  foreach (array_slice($files, $keep) as $old) {
    @unlink($old);
  }
}

/** Restaura bio.json.bak → publicado + rascunho. */
function bio_restore_backup(): ?array
{
  $backup = bio_read_json(bio_backup_path());
  if ($backup === null) {
    return null;
  }
  if (!bio_write_json(bio_published_path(), $backup)) {
    return null;
  }
  if (!bio_write_json(bio_draft_path(), $backup)) {
    return null;
  }
  return $backup;
}

function bio_has_backup(): bool
{
  return is_file(bio_backup_path()) && filesize(bio_backup_path()) > 0;
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
  $paths = [bio_published_path(), bio_draft_path(), bio_backup_path()];
  foreach ($paths as $path) {
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
      'hasBackup' => bio_has_backup(),
    ];
  }

  if ($published !== null) {
    return [
      'config' => $published,
      'source' => 'published',
      'hasDraft' => false,
      'published' => $published,
      'hasBackup' => bio_has_backup(),
    ];
  }

  return [
    'config' => null,
    'source' => 'none',
    'hasDraft' => false,
    'published' => null,
    'hasBackup' => bio_has_backup(),
  ];
}
