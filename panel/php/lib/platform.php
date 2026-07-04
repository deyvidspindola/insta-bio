<?php

require_once __DIR__ . '/reserved-slugs.php';

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
  $reserved = require __DIR__ . '/reserved-slugs.php';

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

  if (!is_dir($dest) && !mkdir($dest, 0755, true) && !is_dir($dest)) {
    throw new RuntimeException('Não foi possível criar a pasta do cliente');
  }

  $iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST,
  );

  foreach ($iterator as $item) {
    $target = $dest . DIRECTORY_SEPARATOR . $iterator->getSubPathName();
    if ($item->isDir()) {
      if (!is_dir($target) && !mkdir($target, 0755, true) && !is_dir($target)) {
        throw new RuntimeException('Falha ao criar subpasta: ' . $target);
      }
    } else {
      if (!copy($item->getPathname(), $target)) {
        throw new RuntimeException('Falha ao copiar arquivo: ' . $target);
      }
    }
  }
}

function write_client_auth_config(string $editorDir, string $email, string $passwordHash): void
{
  $emailEsc = addslashes($email);
  $hashEsc = addslashes($passwordHash);
  $content = <<<PHP
<?php
define('AUTH_USERNAME', '{$emailEsc}');
define('AUTH_PASSWORD_HASH', '{$hashEsc}');
define('BIO_JSON_PATH', __DIR__ . '/../bio.json');
define('ASSETS_DIR', __DIR__ . '/../assets');

PHP;
  if (file_put_contents($editorDir . '/auth.config.php', $content) === false) {
    throw new RuntimeException('Não foi possível gravar auth.config.php');
  }
}

function update_client_password(string $platformRoot, string $slug, string $email, string $passwordHash): void
{
  $editorDir = rtrim($platformRoot, '/\\') . DIRECTORY_SEPARATOR . $slug . DIRECTORY_SEPARATOR . 'editor';
  if (!is_dir($editorDir)) {
    throw new RuntimeException('Pasta do editor não encontrada para este cliente');
  }
  write_client_auth_config($editorDir, $email, $passwordHash);
}

function write_client_htaccess(string $clientDir): void
{
  $content = <<<'HTACCESS'
# Links na Bio — cliente
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_URI} !/suspended\.html$ [NC]
  RewriteCond .suspended -f
  RewriteRule ^ suspended.html [L]
</IfModule>

# bio.json sempre fresco após salvar no editor
<Files "bio.json">
  <IfModule mod_headers.c>
    Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
    Header set Pragma "no-cache"
    Header set Expires "0"
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

function customize_bio_json(string $bioPath, string $clientName, string $slug): void
{
  if (!file_exists($bioPath)) {
    throw new RuntimeException('bio.json não encontrado no template');
  }

  $data = json_decode(file_get_contents($bioPath), true);
  if (!is_array($data)) {
    throw new RuntimeException('bio.json inválido no template');
  }

  $data['brand']['name'] = $clientName;
  if (isset($data['brand']['seo'])) {
    $data['brand']['seo']['title'] = $clientName . ' · Link na Bio';
    $data['brand']['seo']['description'] =
      'Página de links de ' . $clientName . '. Edite no painel do editor.';
  }
  $data['brand']['footer'] = '© ' . date('Y') . ' ' . $clientName;

  $json = json_encode(
    $data,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
  );

  if ($json === false || file_put_contents($bioPath, $json . "\n") === false) {
    throw new RuntimeException('Não foi possível personalizar bio.json');
  }
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

function provision_client(string $platformRoot, string $templateDir, string $slug, string $name, string $email, string $passwordHash): array
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

  copy_directory($templateDir, $clientDir);

  write_client_htaccess($clientDir);

  $editorDir = $clientDir . DIRECTORY_SEPARATOR . 'editor';
  write_client_auth_config($editorDir, $email, $passwordHash);
  customize_bio_json($clientDir . DIRECTORY_SEPARATOR . 'bio.json', $name, $slug);

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

  $stmt = $pdo->prepare('SELECT * FROM clients WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
  $client = $stmt->fetch();
  if (!$client) {
    throw new RuntimeException('Cliente não encontrado');
  }

  $oldSlug = $client['slug'];

  if ($newSlug !== $oldSlug) {
    $check = $pdo->prepare('SELECT id FROM clients WHERE slug = ? AND id != ? LIMIT 1');
    $check->execute([$newSlug, $id]);
    if ($check->fetch()) {
      throw new InvalidArgumentException('Este slug já está em uso');
    }
  }

  if (strtolower($email) !== strtolower($client['email'])) {
    $checkEmail = $pdo->prepare('SELECT id FROM clients WHERE email = ? AND id != ? LIMIT 1');
    $checkEmail->execute([$email, $id]);
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

  $update = $pdo->prepare(
    'UPDATE clients SET slug = ?, name = ?, email = ?, updated_at = NOW() WHERE id = ?',
  );
  $update->execute([$newSlug, $name, $email, $id]);

  return [
    'id' => $id,
    'slug' => $newSlug,
    'name' => $name,
    'email' => $email,
    'status' => $client['status'],
    'slug_changed' => $newSlug !== $oldSlug,
    'bio_url' => '/' . $newSlug . '/',
    'editor_url' => '/' . $newSlug . '/editor/',
  ];
}
