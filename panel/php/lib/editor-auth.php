<?php

require_once __DIR__ . '/license.php';

function editor_auth_cors_headers(): void
{
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
}

function editor_auth_json_input(): array
{
  $raw = file_get_contents('php://input');
  if ($raw === false || $raw === '') {
    return [];
  }

  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function lookup_client_editor_credentials(
  PDO $pdo,
  string $slug,
  string $token,
  string $email,
  string $password = '',
): ?array {
  platform_ensure_license_column($pdo);

  $stmt = $pdo->prepare(
    'SELECT id, slug, email, password_hash, status FROM clients WHERE slug = ? AND license_token = ? LIMIT 1',
  );
  $stmt->execute([normalize_slug($slug), $token]);
  $client = $stmt->fetch();
  if (!$client) {
    return null;
  }

  if ($client['status'] !== 'active') {
    return null;
  }

  if (strtolower(trim($email)) !== strtolower(trim((string) $client['email']))) {
    return null;
  }

  if ($password !== '' && !password_verify($password, (string) $client['password_hash'])) {
    return null;
  }

  return $client;
}

function editor_auth_handshake(string $token, string $email, string $slug): array
{
  $nonce = bin2hex(random_bytes(16));
  $email = strtolower(trim($email));
  $sig = hash_hmac('sha256', $nonce . '|' . $email . '|' . normalize_slug($slug), $token);

  return [
    'nonce' => $nonce,
    'sig' => $sig,
  ];
}

function editor_auth_verify_handshake(
  string $token,
  string $email,
  string $slug,
  string $nonce,
  string $sig,
): bool {
  if ($nonce === '' || $sig === '') {
    return false;
  }

  $email = strtolower(trim($email));
  $expected = hash_hmac('sha256', $nonce . '|' . $email . '|' . normalize_slug($slug), $token);
  return hash_equals($expected, $sig);
}
