<?php
// Copie este arquivo para "auth.config.php" e ajuste os valores.
// NUNCA coloque senha em texto puro — use o hash bcrypt.
//
// Gere o hash rodando no seu computador:
//   npm run hash-password --prefix admin -- "sua-senha-forte"
// e cole abaixo o valor mostrado (começa com $2a$ ou $2b$).

define('AUTH_USERNAME', 'admin');
define('AUTH_PASSWORD_HASH', '$2a$10$COLE_AQUI_O_HASH_GERADO');

// Onde fica o bio.json do site (relativo a esta pasta).
// Padrão: editor em uma subpasta e o site na raiz -> ../bio.json
define('BIO_JSON_PATH', __DIR__ . '/../bio.json');

// Pasta de imagens do site (relativo a esta pasta).
define('ASSETS_DIR', __DIR__ . '/../assets');
