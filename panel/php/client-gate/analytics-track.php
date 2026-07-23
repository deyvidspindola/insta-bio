<?php
/**
 * Proxy same-origin de analytics (bio pública → painel).
 * A lógica vive em client-license.php (client_analytics_proxy_run).
 * Este arquivo é um atalho; o rewrite preferido é index.php?__ib_analytics_track=1
 * para funcionar mesmo se o apply antigo não copiar este arquivo.
 */
ini_set('display_errors', '0');

require_once __DIR__ . '/client-license.php';
client_analytics_proxy_run();
