<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';
require __DIR__ . '/lib/instagram.php';
platform_require_auth();
header('Content-Type: application/json');

try {
  $input = platform_json_input();
  $name = platform_input_name($input['name'] ?? '');
  $slug = platform_input_string($input['slug'] ?? '', 40);
  $email = platform_input_email($input['email'] ?? '');
  $selfHosted = platform_input_bool($input['self_hosted'] ?? false);
  $allowedHost = platform_input_host($input['allowed_host'] ?? '');
  $deployPath = platform_input_deploy_path($input['deploy_path'] ?? '');
  $providedPassword = platform_input_password($input['password'] ?? '');
  $instagramHandle = platform_input_instagram_handle($input['instagram_handle'] ?? '');

  if ($slug === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Nome, slug e e-mail são obrigatórios']);
    exit;
  }

  $slug = normalize_slug($slug);
  $error = validate_slug($slug);
  if ($error !== null) {
    http_response_code(400);
    echo json_encode(['error' => $error]);
    exit;
  }

  platform_load_config();
  $pdo = platform_db();
  platform_ensure_license_column($pdo);

  $hosting = resolve_client_hosting_input($selfHosted, $allowedHost, $deployPath);

  $check = platform_db_execute(
    $pdo,
    'SELECT id FROM clients WHERE slug = ? OR email = ? LIMIT 1',
    [$slug, $email],
  );
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
  if ($instagramHandle !== '') {
    try {
      $profile = fetch_instagram_profile($instagramHandle);
      $clientDir = rtrim(PLATFORM_ROOT, '/\\') . DIRECTORY_SEPARATOR . $slug;
      apply_instagram_to_client($clientDir, $profile, $name);
    } catch (Throwable $e) {
      $instagramWarning = $e->getMessage();
    }
  }

  platform_db_execute(
    $pdo,
    'INSERT INTO clients (slug, name, email, password_hash, password_enc, status, license_token, allowed_host, self_hosted, deploy_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      $slug,
      $name,
      $email,
      $passwordHash,
      $passwordEnc,
      'active',
      $licenseToken,
      $hosting['allowed_host'],
      $hosting['self_hosted'] ? 1 : 0,
      $hosting['deploy_path'],
    ],
  );

  $clientId = (int) $pdo->lastInsertId();

  sync_client_license_files($pdo, PLATFORM_ROOT, [
    'id' => $clientId,
    'slug' => $slug,
    'license_token' => $licenseToken,
    'allowed_host' => $hosting['allowed_host'],
    'self_hosted' => $hosting['self_hosted'],
    'deploy_path' => $hosting['deploy_path'],
  ]);

  echo json_encode([
    'ok' => true,
    'client' => [
      'id' => $clientId,
      'slug' => $slug,
      'name' => $name,
      'email' => $email,
      'status' => 'active',
      'self_hosted' => $hosting['self_hosted'],
      'allowed_host' => $hosting['allowed_host'],
      'deploy_path' => $hosting['deploy_path'],
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
