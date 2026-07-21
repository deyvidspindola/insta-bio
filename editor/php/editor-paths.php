<?php

require_once __DIR__ . '/bio-path.php';

function editor_auth_config_file(): string
{
  return __DIR__ . '/auth.config.php';
}

function editor_default_bio_path(): string
{
  return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'bio.json';
}

function editor_default_assets_dir(): string
{
  return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'assets';
}

/**
 * @return array{ok: true, path: string, assetsDir: string}|array{ok: false, error: string}
 */
function editor_normalize_bio_path_input(string $input): array
{
  $input = trim($input);
  if ($input === '') {
    return ['ok' => false, 'error' => 'Informe o caminho do bio.json'];
  }

  if (!preg_match('/\.json$/i', $input)) {
    return ['ok' => false, 'error' => 'O caminho deve terminar em .json'];
  }

  if (str_contains($input, "\0")) {
    return ['ok' => false, 'error' => 'Caminho inválido'];
  }

  $editorDir = __DIR__;

  if ($input[0] === '/' || preg_match('#^[A-Za-z]:[/\\\\]#', $input)) {
    $resolved = str_replace('\\', '/', $input);
  } else {
    $resolved = str_replace('\\', '/', $editorDir . '/' . ltrim($input, '/'));
  }

  $parentDir = dirname($resolved);
  if (!is_dir($parentDir) && !@mkdir($parentDir, 0755, true)) {
    return ['ok' => false, 'error' => 'A pasta do arquivo não existe e não pôde ser criada'];
  }

  return [
    'ok' => true,
    'path' => $resolved,
    'assetsDir' => rtrim(str_replace('\\', '/', $parentDir), '/') . '/assets',
  ];
}

function editor_path_to_define_expr(string $editorDir, string $absolutePath): string
{
  $editorReal = realpath($editorDir);
  $targetReal = realpath($absolutePath);
  $isDir = is_dir($absolutePath);

  if ($targetReal === false && $isDir) {
    $targetReal = realpath(dirname($absolutePath));
    if ($targetReal !== false) {
      $targetReal = rtrim(str_replace('\\', '/', $targetReal), '/') . '/' . basename($absolutePath);
    }
  }

  if ($editorReal && $targetReal) {
    $editorReal = rtrim(str_replace('\\', '/', $editorReal), '/');
    $targetReal = str_replace('\\', '/', $targetReal);
    if (str_starts_with($targetReal, $editorReal . '/') || $targetReal === $editorReal) {
      $relative = ltrim(substr($targetReal, strlen($editorReal)), '/');
      return "__DIR__ . '/" . $relative . "'";
    }
  }

  $escaped = addslashes(str_replace('\\', '/', $absolutePath));
  return "'" . $escaped . "'";
}

function editor_paths_config_content(string $bioJsonPath, string $assetsDir): string
{
  $editorDir = __DIR__;
  $bioExpr = editor_path_to_define_expr($editorDir, $bioJsonPath);
  $assetsExpr = editor_path_to_define_expr($editorDir, rtrim($assetsDir, '/\\'));

  return <<<PHP
<?php
// Caminhos do editor — atualizado pelo painel de configurações.
define('BIO_JSON_PATH', {$bioExpr});
define('ASSETS_DIR', {$assetsExpr});

PHP;
}

function editor_write_paths_config(string $bioJsonPath, string $assetsDir): bool
{
  $content = editor_paths_config_content($bioJsonPath, $assetsDir);
  if (file_put_contents(editor_auth_config_file(), $content) === false) {
    return false;
  }

  write_bio_path_json(bio_path_client_root_from_editor(), $bioJsonPath);
  return true;
}

/**
 * @return array{
 *   bioJsonPath: string,
 *   assetsDir: string,
 *   draftPath: string,
 *   configFile: string,
 *   bioExists: bool,
 *   draftExists: bool,
 *   writable: bool
 * }
 */
function editor_read_paths_info(): array
{
  $bio = defined('BIO_JSON_PATH') ? (string) BIO_JSON_PATH : editor_default_bio_path();
  $assets = defined('ASSETS_DIR') ? (string) ASSETS_DIR : editor_default_assets_dir();
  $draft = defined('BIO_DRAFT_JSON_PATH')
    ? (string) BIO_DRAFT_JSON_PATH
    : dirname($bio) . DIRECTORY_SEPARATOR . 'bio.draft.json';

  $parentWritable = is_dir(dirname($bio)) && is_writable(dirname($bio));
  $fileWritable = is_file($bio) ? is_writable($bio) : $parentWritable;

  return [
    'bioJsonPath' => str_replace('\\', '/', $bio),
    'assetsDir' => str_replace('\\', '/', $assets),
    'draftPath' => str_replace('\\', '/', $draft),
    'publicBioUrl' => bio_path_to_relative($bio, bio_path_client_root_from_editor()),
    'configFile' => str_replace('\\', '/', editor_auth_config_file()),
    'bioExists' => is_file($bio),
    'draftExists' => is_file($draft),
    'writable' => $fileWritable,
  ];
}
