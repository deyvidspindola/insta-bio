<?php

require_once __DIR__ . '/lib/input.php';

/**
 * Carrega db.config.php uma única vez por request (evita "Constant already defined").
 */
function platform_load_config(): void
{
  static $loaded = false;
  if ($loaded) {
    return;
  }

  $configFile = __DIR__ . '/db.config.php';
  if (!file_exists($configFile)) {
    throw new RuntimeException('Configure panel/php/db.config.php antes de usar o painel.');
  }

  require_once $configFile;
  $loaded = true;
}

/**
 * Inicializa monitoramento de erros no Sentry (quando instalado via Composer).
 * O painel continua funcionando normalmente se o SDK não estiver presente.
 */
function platform_init_observability(): void
{
  static $initialized = false;
  if ($initialized) {
    return;
  }
  $initialized = true;

  $autoload = __DIR__ . '/vendor/autoload.php';
  if (!file_exists($autoload)) {
    return;
  }

  require_once $autoload;

  if (!function_exists('\\Sentry\\init')) {
    return;
  }

  $configFile = __DIR__ . '/db.config.php';
  if (!file_exists($configFile)) {
    return;
  }

  platform_load_config();

  $dsn = defined('SENTRY_DSN') ? SENTRY_DSN : null;
  if ($dsn === null || $dsn === '') {
    return;
  }

  $tracesSampleRate = defined('SENTRY_TRACES_SAMPLE_RATE') ? (float) SENTRY_TRACES_SAMPLE_RATE : null;
  $profilesSampleRate = defined('SENTRY_PROFILES_SAMPLE_RATE') ? (float) SENTRY_PROFILES_SAMPLE_RATE : null;
  $enableLogs = defined('SENTRY_ENABLE_LOGS') ? (bool) SENTRY_ENABLE_LOGS : false;

  // Apenas erros graves — não envia warnings/notices ao Sentry.
  $errorTypes = E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR | E_RECOVERABLE_ERROR;

  \Sentry\init([
    'dsn' => $dsn,
    'traces_sample_rate' => $tracesSampleRate ?? 1.0,
    'profiles_sample_rate' => $profilesSampleRate ?? 1.0,
    'enable_logs' => $enableLogs,
    'error_types' => $errorTypes,
  ]);
}

/**
 * Registra a exceção no Sentry (quando configurado) e SEMPRE no log de erros do
 * PHP — assim há rastro da causa real mesmo sem Sentry (ex.: cPanel error_log),
 * já que as respostas ao cliente usam mensagens genéricas.
 *
 * @param array<string, mixed> $context
 */
function platform_capture_exception(Throwable $exception, array $context = []): void
{
  $contextJson = $context !== []
    ? json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
    : '';
  error_log(sprintf(
    '[insta-bio] %s: %s @ %s:%d %s',
    get_class($exception),
    $exception->getMessage(),
    $exception->getFile(),
    $exception->getLine(),
    is_string($contextJson) ? $contextJson : '',
  ));

  if (!function_exists('\\Sentry\\captureException')) {
    return;
  }

  if ($context !== [] && function_exists('\\Sentry\\withScope')) {
    \Sentry\withScope(function ($scope) use ($exception, $context): void {
      foreach ($context as $key => $value) {
        $scope->setExtra((string) $key, $value);
      }
      \Sentry\captureException($exception);
    });
    return;
  }

  \Sentry\captureException($exception);
}

platform_init_observability();

function platform_db(): PDO
{
  static $pdo = null;
  if ($pdo !== null) {
    return $pdo;
  }

  platform_load_config();

  $pdo = new PDO(
    'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
    DB_USER,
    DB_PASS,
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      // Prepared statements nativos — não interpolar SQL no cliente.
      PDO::ATTR_EMULATE_PREPARES => false,
    ],
  );

  return $pdo;
}

function platform_session_start(): void
{
  if (session_status() === PHP_SESSION_ACTIVE) {
    return;
  }

  session_name('platform_session');
  session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/panel/',
    'httponly' => true,
    'samesite' => 'Strict',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
  ]);
  session_start();
}

function platform_require_auth(): void
{
  platform_session_start();
  if (empty($_SESSION['platform_admin_id'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Não autenticado']);
    exit;
  }
}

function platform_json_input(): array
{
  $raw = file_get_contents('php://input');
  if ($raw === false || $raw === '') {
    return [];
  }
  // Limite defensivo contra payloads enormes
  if (strlen($raw) > 1_048_576) {
    http_response_code(413);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Payload JSON muito grande']);
    exit;
  }
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

/**
 * Executa SELECT/DML apenas via prepared statement.
 * Use para qualquer SQL que receba parâmetros do usuário.
 *
 * @param list<mixed> $params
 */
function platform_db_execute(PDO $pdo, string $sql, array $params = []): PDOStatement
{
  if (str_contains($sql, '${') || preg_match('/\$[a-zA-Z_]/', $sql)) {
    throw new RuntimeException('SQL inseguro: não use interpolação de variáveis na query');
  }
  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  return $stmt;
}

function app_encrypt(string $plain): string
{
  $key = hash('sha256', APP_SECRET, true);
  $iv = random_bytes(16);
  $cipher = openssl_encrypt($plain, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
  return base64_encode($iv . $cipher);
}

function app_decrypt(?string $enc): ?string
{
  if ($enc === null || $enc === '') {
    return null;
  }
  $raw = base64_decode($enc, true);
  if ($raw === false || strlen($raw) <= 16) {
    return null;
  }
  $key = hash('sha256', APP_SECRET, true);
  $iv = substr($raw, 0, 16);
  $cipher = substr($raw, 16);
  $plain = openssl_decrypt($cipher, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
  return $plain === false ? null : $plain;
}
