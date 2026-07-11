<?php
/**
 * POST editor/update-check.php (rota pública: api/update/check)
 *
 * Verifica se há uma nova versão disponível na plataforma (ZIP único).
 * Vale para clientes da plataforma e self-hosted (com license.config.php).
 * Erros vão para editor/update.log.
 */

require __DIR__ . '/auth.config.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
require_once __DIR__ . '/update-log.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    editor_update_fail(405, 'Método não permitido', 'check method_not_allowed', [
        'method' => $_SERVER['REQUEST_METHOD'] ?? '',
    ]);
}

if (!isset($_SESSION['user'])) {
    editor_update_fail(401, 'Não autenticado', 'check unauthenticated');
}

if (!function_exists('editor_load_license_config')) {
    require_once __DIR__ . '/platform-auth.php';
}

$config = editor_load_license_config();
if ($config === null || empty($config['slug']) || empty($config['token'])) {
    editor_update_fail(400, 'Atualização remota indisponível: licença não configurada.', 'check license_missing');
}

$stateFile = __DIR__ . '/update-state.json';
$installedVersion = '0.0.0';
if (is_file($stateFile)) {
    $raw = json_decode((string) file_get_contents($stateFile), true);
    if (is_array($raw) && !empty($raw['version'])) {
        $installedVersion = $raw['version'];
    }
}

$sessionUser = is_string($_SESSION['user'] ?? null) ? $_SESSION['user'] : 'unknown';
$slug = (string) ($config['slug'] ?? '');

try {
    $url = editor_platform_api_url($config['api'], 'updates/check');
    $payload = editor_license_api_payload([
        'installed' => $installedVersion,
    ]);

    $result = editor_platform_post_json($url, $payload);

    if (!isset($result['ok']) || $result['ok'] !== true) {
        $error = $result['error'] ?? 'Falha na comunicação com a plataforma.';
        $status = (int) ($result['http_status'] ?? 500);
        if ($status < 400) {
            $status = 500;
        }
        editor_update_fail($status, $error, 'check platform_error', [
            'user' => $sessionUser,
            'slug' => $slug,
            'installed' => $installedVersion,
            'http_status' => $result['http_status'] ?? null,
            'api_error' => $result['error'] ?? null,
        ]);
    }

    editor_update_log('info', 'check ok', [
        'user' => $sessionUser,
        'slug' => $slug,
        'installed' => $installedVersion,
        'latest' => $result['latest'] ?? null,
        'updateAvailable' => !empty($result['updateAvailable']),
    ]);

    $result['installed'] = $installedVersion;
    echo json_encode($result);
    exit;
} catch (Exception $e) {
    editor_update_fail(
        500,
        'Erro ao verificar atualizações: ' . $e->getMessage(),
        'check exception',
        [
            'user' => $sessionUser,
            'slug' => $slug,
            'installed' => $installedVersion,
            'message' => $e->getMessage(),
        ]
    );
}
