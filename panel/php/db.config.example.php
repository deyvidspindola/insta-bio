<?php
// Copie para db.config.php e ajuste os valores.

define('DB_HOST', 'localhost');
define('DB_NAME', 'seu_banco');
define('DB_USER', 'seu_usuario');
define('DB_PASS', 'sua_senha');

// Chave para cifrar/decifrar as senhas dos clientes (consulta posterior).
// Gere uma aleatória e NÃO compartilhe. Ex.: openssl rand -hex 32
define('APP_SECRET', 'troque-por-uma-chave-aleatoria-longa');

// Raiz do site (public_html) — um nível acima de /panel/
define('PLATFORM_ROOT', dirname(__DIR__));
define('TEMPLATE_DIR', PLATFORM_ROOT . '/_template');
