<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';
require __DIR__ . '/lib/instagram.php';
platform_require_auth();
header('Content-Type: application/json');

$input = platform_json_input();
$name = isset($input['name']) ? trim((string) $input['name']) : '';
$slug = isset($input['slug']) ? (string) $input['slug'] : '';
$email = isset($input['email']) ? strtolower(trim((string) $input['email'])) : '';

if ($name === '' || $slug === '' || $email === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Nome, slug e e-mail são obrigatórios']);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['error' => 'E-mail inválido']);
  exit;
}

$slug = normalize_slug($slug);
$error = validate_slug($slug);
if ($error !== null) {
  http_response_code(400);
  echo json_encode(['error' => $error]);
  exit;
}

$providedPassword = isset($input['password']) ? trim((string) $input['password']) : '';
if ($providedPassword !== '' && strlen($providedPassword) < 6) {
  http_response_code(400);
  echo json_encode(['error' => 'A senha deve ter pelo menos 6 caracteres']);
  exit;
}

try {
  platform_load_config();
  $pdo = platform_db();

  $check = $pdo->prepare('SELECT id FROM clients WHERE slug = ? OR email = ? LIMIT 1');
  $check->execute([$slug, $email]);
  if ($check->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Slug ou e-mail já cadastrado']);
    exit;
  }

  $plainPassword = $providedPassword !== '' ? $providedPassword : generate_password(12);
  $passwordHash = password_hash($plainPassword, PASSWORD_BCRYPT);
  $passwordEnc = app_encrypt($plainPassword);
  $licenseToken = generate_license_token();

  $provision = provision_client(
    PLATFORM_ROOT,
    TEMPLATE_DIR,
    $slug,
    $name,
    $email,
    $passwordHash,
    $licenseToken,
    platform_public_base_url(),
  );

  $instagramWarning = null;
  $instagramHandle = isset($input['instagram_handle']) ? trim((string) $input['instagram_handle']) : '';
  if ($instagramHandle !== '') {
    try {
      $profile = fetch_instagram_profile($instagramHandle);
      $clientDir = rtrim(PLATFORM_ROOT, '/\\') . DIRECTORY_SEPARATOR . $slug;
      apply_instagram_to_client($clientDir, $profile, $name);
    } catch (Throwable $e) {
      $instagramWarning = $e->getMessage();
    }
  }

  $insert = $pdo->prepare(
    'INSERT INTO clients (slug, name, email, password_hash, password_enc, status, license_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  $insert->execute([$slug, $name, $email, $passwordHash, $passwordEnc, 'active', $licenseToken]);

  echo json_encode([
    'ok' => true,
    'client' => [
      'id' => (int) $pdo->lastInsertId(),
      'slug' => $slug,
      'name' => $name,
      'email' => $email,
      'status' => 'active',
      'bio_url' => $provision['bio_url'],
      'editor_url' => $provision['editor_url'],
      'password' => $plainPassword,
    ],
    'instagram_warning' => $instagramWarning,
  ]);
} catch (InvalidArgumentException $e) {
  platform_capture_exception($e);
  http_response_code(400);
  echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
