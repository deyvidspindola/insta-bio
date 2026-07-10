<?php
/**
 * Instalação única do banco — acesse /panel/install após subir os arquivos.
 * Cria tabelas e o admin inicial. Bloqueia novas execuções com .install-done
 */
require __DIR__ . '/bootstrap.php';

header('Content-Type: text/html; charset=utf-8');

$configFile = __DIR__ . '/db.config.php';
$lockFile = __DIR__ . '/.install-done';

if (file_exists($lockFile)) {
  echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Instalação</title></head><body style="font-family:system-ui;max-width:32rem;margin:3rem auto;padding:0 1rem">';
  echo '<h1>Já instalado</h1><p>O banco já foi configurado neste servidor.</p>';
  echo '<p><a href="./">Abrir painel</a></p></body></html>';
  exit;
}

if (!file_exists($configFile)) {
  http_response_code(500);
  echo 'Arquivo db.config.php não encontrado em /panel/.';
  exit;
}

require $configFile;

$adminEmail = 'admin@linksnabio.app.br';
$adminHash = '$2b$10$ZewAUrubp6a.uBekByPQreU/kfrp/DeXTtq4SewqvxV1pI4gPpJ8.';

try {
  $pdo = new PDO(
    'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
    DB_USER,
    DB_PASS,
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ],
  );

  $pdo->exec(
    'CREATE TABLE IF NOT EXISTS platform_admins (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email         VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  );

  $pdo->exec(
    'CREATE TABLE IF NOT EXISTS clients (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      slug          VARCHAR(40) NOT NULL UNIQUE,
      name          VARCHAR(120) NOT NULL,
      email         VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      password_enc  VARCHAR(255) NULL,
      status        ENUM(\'active\', \'suspended\', \'pending\') NOT NULL DEFAULT \'active\',
      license_token CHAR(48) NULL UNIQUE,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  );

  $count = (int) $pdo->query('SELECT COUNT(*) AS c FROM platform_admins')->fetch()['c'];
  if ($count === 0) {
    platform_db_execute(
      $pdo,
      'INSERT INTO platform_admins (email, password_hash) VALUES (?, ?)',
      [$adminEmail, $adminHash],
    );
  }

  file_put_contents($lockFile, gmdate('c') . "\n");

  require __DIR__ . '/lib/platform.php';
  $sitesDir = __DIR__ . '/sites';
  if (!is_dir($sitesDir)) {
    @mkdir($sitesDir, 0755, true);
  }
  $provision = platform_provision_check(defined('PLATFORM_ROOT') ? PLATFORM_ROOT : $sitesDir, TEMPLATE_DIR);

  echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Instalação OK</title></head><body style="font-family:system-ui;max-width:32rem;margin:3rem auto;padding:0 1rem;line-height:1.5">';
  echo '<h1>Banco instalado</h1>';
  echo '<p>Tabelas criadas e admin configurado com sucesso.</p>';
  echo '<p><strong>E-mail:</strong> ' . htmlspecialchars($adminEmail, ENT_QUOTES, 'UTF-8') . '<br>';
  echo '<strong>Senha inicial:</strong> LinksNaBio@2026 <em>(troque após o login)</em></p>';

  if ($provision['ok']) {
    echo '<p style="color:#0a7">Provisionamento de pastas: <strong>OK</strong> — o painel pode criar clientes automaticamente.</p>';
  } else {
    echo '<p style="color:#c30"><strong>Atenção:</strong> o servidor pode não conseguir criar pastas de clientes. Detalhes:</p><ul style="font-size:0.9rem">';
    foreach ($provision['checks'] as $check) {
      $mark = $check['ok'] ? '✓' : '✗';
      echo '<li>' . $mark . ' ' . htmlspecialchars($check['name'], ENT_QUOTES, 'UTF-8') . ': '
        . htmlspecialchars($check['detail'], ENT_QUOTES, 'UTF-8') . '</li>';
    }
    echo '</ul>';
  }

  echo '<p><a href="./" style="display:inline-block;margin-top:1rem;padding:0.6rem 1.2rem;background:#e67e22;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Entrar no painel</a></p>';
  echo '<p style="font-size:0.85rem;color:#666;margin-top:2rem">Por segurança, você pode apagar <code>install.php</code> do servidor (a URL /panel/install deixa de funcionar).</p>';
  echo '</body></html>';
} catch (Throwable $e) {
  platform_capture_exception($e);
  http_response_code(500);
  echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Erro</title></head><body style="font-family:system-ui;max-width:32rem;margin:3rem auto;padding:0 1rem">';
  echo '<h1>Falha na instalação</h1>';
  echo '<p>' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</p>';
  echo '<p>Confira em <code>db.config.php</code> se host, banco, usuário e senha estão corretos no cPanel.</p>';
  echo '</body></html>';
}
