<?php
/**
 * GET editor/update-status.php  (rota pública: api/update/status)
 *
 * Só leitura — devolve o estado local de versão (update-state.json) e se
 * este cliente é da plataforma (não tem botão de update, gerenciado pelo /panel/).
 *
 * Fase B do plano em docs/ATUALIZACOES-REMOTAS.md.
 * Não faz check remoto nem apply — isso é Fase C/D.
 */

require __DIR__ . '/auth.config.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(['error' => 'Método não permitido']);
  exit;
}

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Não autenticado']);
  exit;
}

$stateFile = __DIR__ . '/update-state.json';
$state = [
  'version' => 'desconhecida',
  'updatedAt' => null,
  'channel' => 'stable',
];

if (is_file($stateFile)) {
  $raw = json_decode((string) file_get_contents($stateFile), true);
  if (is_array($raw)) {
    $state = array_merge($state, $raw);
  }
}

echo json_encode([
  'ok' => true,
  'state' => $state,
  'platformManaged' => is_file(__DIR__ . '/platform-api.json'),
]);
