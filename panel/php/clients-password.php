<?php
require __DIR__ . '/bootstrap.php';
platform_require_auth();
header('Content-Type: application/json');

$input = platform_json_input();
$id = isset($input['id']) ? (int) $input['id'] : 0;

if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'ID inválido']);
  exit;
}

try {
  require __DIR__ . '/db.config.php';
  $pdo = platform_db();

  $stmt = $pdo->prepare('SELECT password_enc FROM clients WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
  $client = $stmt->fetch();

  if (!$client) {
    http_response_code(404);
    echo json_encode(['error' => 'Cliente não encontrado']);
    exit;
  }

  $password = app_decrypt($client['password_enc'] ?? null);

  if ($password === null) {
    echo json_encode([
      'ok' => true,
      'password' => null,
      'note' => 'Senha não disponível (cliente anterior à cifragem). Use "Redefinir senha".',
    ]);
    exit;
  }

  echo json_encode(['ok' => true, 'password' => $password]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
