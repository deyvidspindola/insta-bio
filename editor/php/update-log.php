<?php
/**
 * Log de atualizações remotas em editor/update.log (não público).
 *
 * Uso:
 *   require_once __DIR__ . '/update-log.php';
 *   editor_update_log('info', 'apply start', ['version' => '1.0.2']);
 *   editor_update_fail(500, 'Mensagem ao usuário', 'apply download_failed', ['http' => 403]);
 */

function editor_update_log_path(): string
{
    return __DIR__ . '/update.log';
}

/**
 * @param 'debug'|'info'|'warn'|'error' $level
 * @param array<string, mixed> $context
 */
function editor_update_log(string $level, string $message, array $context = []): void
{
    $path = editor_update_log_path();

    // Rotação simples (~2 MB)
    if (is_file($path) && @filesize($path) > 2 * 1024 * 1024) {
        @rename($path, $path . '.1');
    }

    $safe = [];
    foreach ($context as $key => $value) {
        $keyStr = (string) $key;
        if (preg_match('/token|password|secret|authorization/i', $keyStr)) {
            $safe[$keyStr] = '[redacted]';
            continue;
        }
        if (is_bool($value) || is_int($value) || is_float($value) || $value === null) {
            $safe[$keyStr] = $value;
        } elseif (is_string($value)) {
            // Evita logar URLs assinadas inteiras (podem ter query secret)
            if (preg_match('/^https?:\/\//i', $value) && preg_match('/[?&](sig|signature|token|expires)=/i', $value)) {
                $parts = parse_url($value);
                $host = $parts['host'] ?? '';
                $pathPart = $parts['path'] ?? '';
                $safe[$keyStr] = ($parts['scheme'] ?? 'https') . '://' . $host . $pathPart . '?[signed]';
            } else {
                $safe[$keyStr] = mb_strlen($value) > 500 ? (mb_substr($value, 0, 500) . '…') : $value;
            }
        } else {
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $safe[$keyStr] = is_string($encoded) ? $encoded : '[unserializable]';
        }
    }

    $line = '[' . date('c') . '] ' . strtoupper($level) . ' ' . $message;
    if ($safe !== []) {
        $json = json_encode($safe, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (is_string($json)) {
            $line .= ' ' . $json;
        }
    }
    $line .= "\n";

    @file_put_contents($path, $line, FILE_APPEND | LOCK_EX);
}

/**
 * Registra erro, responde JSON e encerra.
 *
 * @param array<string, mixed> $context
 */
function editor_update_fail(int $httpStatus, string $publicError, string $logMessage, array $context = []): void
{
    editor_update_log('error', $logMessage, array_merge(['public' => $publicError], $context));
    if (!headers_sent()) {
        http_response_code($httpStatus);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate');
    }
    echo json_encode(['ok' => false, 'error' => $publicError], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
