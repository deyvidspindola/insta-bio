<?php
// Copie para db.config.php e ajuste os valores.
// define() com guarda evita warning se o arquivo for incluído mais de uma vez.

if (!defined('DB_HOST')) {
  define('DB_HOST', 'localhost');
}
if (!defined('DB_NAME')) {
  define('DB_NAME', 'seu_banco');
}
if (!defined('DB_USER')) {
  define('DB_USER', 'seu_usuario');
}
if (!defined('DB_PASS')) {
  define('DB_PASS', 'sua_senha');
}

// Chave para cifrar/decifrar as senhas dos clientes (consulta posterior).
// Gere uma aleatória e NÃO compartilhe. Ex.: openssl rand -hex 32
if (!defined('APP_SECRET')) {
  define('APP_SECRET', 'troque-por-uma-chave-aleatoria-longa');
}

// Sentry (opcional): deixe vazio para desativar.
// O painel envia ao Sentry apenas erros graves (não warnings/notices).
if (!defined('SENTRY_DSN')) {
  define('SENTRY_DSN', '');
}
if (!defined('SENTRY_TRACES_SAMPLE_RATE')) {
  define('SENTRY_TRACES_SAMPLE_RATE', 1.0);
}
if (!defined('SENTRY_PROFILES_SAMPLE_RATE')) {
  define('SENTRY_PROFILES_SAMPLE_RATE', 1.0);
}
if (!defined('SENTRY_ENABLE_LOGS')) {
  define('SENTRY_ENABLE_LOGS', false);
}

// Raiz onde o PHP pode criar pastas dos clientes.
// Na HostGator use panel/sites/ (gravável). As URLs /{slug}/ são reescritas pelo .htaccess da raiz.
if (!defined('PLATFORM_ROOT')) {
  define('PLATFORM_ROOT', __DIR__ . '/sites');
}
// Modelo para novos clientes — na HostGator fica na raiz do domínio: /_template/
// (um nível acima de /panel/, onde está este arquivo após o deploy)
if (!defined('TEMPLATE_DIR')) {
  define('TEMPLATE_DIR', dirname(__DIR__) . '/_template');
}

// Catálogo de updates. Em produção (db.config.php em panel/) use __DIR__/data/...
// No monorepo (db.config.php em panel/php/) use dirname(__DIR__)/data/...
if (!defined('UPDATES_MANIFEST_PATH')) {
  $updatesJson = __DIR__ . '/data/updates/updates.json';
  if (!is_file($updatesJson)) {
    $updatesJson = dirname(__DIR__) . '/data/updates/updates.json';
  }
  define('UPDATES_MANIFEST_PATH', $updatesJson);
}
if (!defined('UPDATES_DIR')) {
  define('UPDATES_DIR', dirname(UPDATES_MANIFEST_PATH));
}
// TTL da URL assinada de download (segundos). Padrão: 5 minutos.
if (!defined('UPDATES_DOWNLOAD_TTL')) {
  define('UPDATES_DOWNLOAD_TTL', 300);
}
// URL pública da plataforma (sem barra final). Ex.: https://linksnabio.app.br
// Se vazio, deriva de HTTPS + HTTP_HOST na requisição.
if (!defined('PLATFORM_PUBLIC_URL')) {
  define('PLATFORM_PUBLIC_URL', '');
}
