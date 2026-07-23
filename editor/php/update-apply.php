<?php
/**
 * POST editor/update-apply.php (rota pública: api/update/apply)
 *
 * Baixa o ZIP, valida SHA-256, faz backup e aplica a atualização.
 * Fonte única para plataforma e self-hosted (requer license.config.php).
 * Erros e etapas relevantes vão para editor/update.log.
 */

require __DIR__ . '/auth.config.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
require_once __DIR__ . '/update-log.php';

@set_time_limit(0);
@ini_set('memory_limit', '256M');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

// 1. Método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    editor_update_fail(405, 'Método não permitido', 'apply method_not_allowed', [
        'method' => $_SERVER['REQUEST_METHOD'] ?? '',
    ]);
}

// 2. Autenticação
if (!isset($_SESSION['user'])) {
    editor_update_fail(401, 'Não autenticado', 'apply unauthenticated');
}

// 3. Carregar licença
if (!function_exists('editor_load_license_config')) {
    require_once __DIR__ . '/platform-auth.php';
}
$config = editor_load_license_config();
if ($config === null || empty($config['slug']) || empty($config['token'])) {
    editor_update_fail(400, 'Atualização remota indisponível: licença não configurada.', 'apply license_missing');
}

// 4. Verificar ZipArchive
if (!class_exists('ZipArchive')) {
    editor_update_fail(500, 'PHP ZipArchive não disponível no servidor.', 'apply ziparchive_missing');
}

$sessionUser = is_string($_SESSION['user'] ?? null) ? $_SESSION['user'] : 'unknown';
$slug = (string) ($config['slug'] ?? '');

editor_update_log('info', 'apply start', [
    'user' => $sessionUser,
    'slug' => $slug,
]);

// 6. Funções auxiliares (espelham sync-clients-template.mjs)
/**
 * Bundle Vite: name-HASH.js|css (index, EditorApp, icons, preview, demo, …).
 * Não casa com imagens do cliente em assets/.
 */
function isBundleFile($name) {
    return preg_match('/^[A-Za-z0-9][A-Za-z0-9._]*-[A-Za-z0-9_-]{6,}\.(js|css)$/', $name) === 1;
}

/** Em editor/assets não há upload do cliente — limpa todo JS/CSS (+ maps). */
function isEditorAssetBundle($name) {
    return preg_match('/\.(js|css)(\.map)?$/i', $name) === 1;
}

function removeBundleFiles($dir, $editorMode = false) {
    if (!is_dir($dir)) return;
    $files = scandir($dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        $path = $dir . '/' . $file;
        if (!is_file($path)) continue;
        $match = $editorMode ? isEditorAssetBundle($file) : isBundleFile($file);
        if ($match) {
            unlink($path);
        }
    }
}

function copyDirExcept($src, $dest, $skipNames = [], &$failures = null, $relPrefix = '') {
    if (!is_dir($dest) && !@mkdir($dest, 0755, true) && !is_dir($dest)) {
        if (is_array($failures)) {
            $failures[] = rtrim($relPrefix, '/') !== '' ? rtrim($relPrefix, '/') : '.';
        }
        return;
    }
    $items = scandir($src);
    if ($items === false) {
        if (is_array($failures)) {
            $failures[] = rtrim($relPrefix, '/') !== '' ? rtrim($relPrefix, '/') : '.';
        }
        return;
    }
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        if (in_array($item, $skipNames, true)) continue;
        $srcPath = $src . '/' . $item;
        $destPath = $dest . '/' . $item;
        $childRel = $relPrefix === '' ? $item : $relPrefix . $item;
        if (is_dir($srcPath)) {
            copyDirExcept($srcPath, $destPath, $skipNames, $failures, $childRel . '/');
        } else {
            $dir = dirname($destPath);
            if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
                if (is_array($failures)) {
                    $failures[] = $childRel;
                }
                continue;
            }
            if (!@copy($srcPath, $destPath)) {
                if (is_array($failures)) {
                    $failures[] = $childRel;
                }
            }
        }
    }
}

function copyFile($src, $dest) {
    $dir = dirname($dest);
    if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
        return false;
    }
    return @copy($src, $dest);
}

/**
 * Arquivos estáticos da bio na raiz do site (não PHP de gate).
 *
 * @return list<string>
 */
function siteStaticRootFiles() {
    return ['index.html', 'favicon.svg', 'icons.svg', 'logo-instabio.svg', 'suspended.html', '.htaccess'];
}

/**
 * Lista o que deve ir da pasta site/ do pacote para a raiz do cliente:
 * estáticos conhecidos + TODOS os .php da raiz (gate). Assim arquivos novos
 * (ex.: analytics-track.php) entram mesmo se o update-apply antigo não listava o nome.
 *
 * @return list<string>
 */
function sitePackageRootFilesToApply($siteSource) {
    $files = siteStaticRootFiles();
    $entries = @scandir($siteSource);
    if ($entries === false) {
        return $files;
    }
    foreach ($entries as $name) {
        if ($name === '.' || $name === '..') {
            continue;
        }
        if (!str_ends_with(strtolower($name), '.php')) {
            continue;
        }
        // license.config.php nunca vem no pacote; se vier, ignore.
        if ($name === 'license.config.php') {
            continue;
        }
        if (is_file($siteSource . '/' . $name)) {
            $files[] = $name;
        }
    }
    return array_values(array_unique($files));
}

/**
 * Copia a raiz do site do pacote e reporta falhas.
 *
 * @param list<string> $failures
 */
function copySitePackageRoot($siteSource, $siteRoot, array &$failures) {
    foreach (sitePackageRootFilesToApply($siteSource) as $file) {
        $src = $siteSource . '/' . $file;
        if (!is_file($src)) {
            continue;
        }
        if (!copyFile($src, $siteRoot . '/' . $file)) {
            $failures[] = $file;
        }
    }
}

/**
 * Garante que todo .php / .htaccess do pacote bateu no destino (hash).
 *
 * @param list<string> $failures
 */
function verifySitePackageRoot($siteSource, $siteRoot, array &$failures) {
    foreach (sitePackageRootFilesToApply($siteSource) as $file) {
        if ($file === 'index.html') {
            continue; // validado à parte com bundles
        }
        $src = $siteSource . '/' . $file;
        if (!is_file($src)) {
            continue;
        }
        if (!str_ends_with(strtolower($file), '.php') && $file !== '.htaccess') {
            continue;
        }
        $dst = $siteRoot . '/' . $file;
        $exp = @hash_file('sha256', $src);
        $act = is_file($dst) ? @hash_file('sha256', $dst) : false;
        if ($exp === false || $act !== $exp) {
            $failures[] = $file;
        }
    }
}

/**
 * Extrai caminhos de bundles referenciados no index.html (assets/…).
 *
 * @return list<string>
 */
function siteBundlesReferencedInHtml($htmlPath) {
    $html = @file_get_contents($htmlPath);
    if ($html === false || $html === '') {
        return [];
    }
    $refs = [];
    if (preg_match_all('#(?:src|href)=["\']([^"\']*assets/[^"\']+\.(?:js|css))["\']#i', $html, $m)) {
        foreach ($m[1] as $ref) {
            $path = parse_url($ref, PHP_URL_PATH);
            if (!is_string($path) || $path === '') {
                $path = $ref;
            }
            $pos = strpos($path, 'assets/');
            if ($pos === false) {
                continue;
            }
            $rel = substr($path, $pos);
            if (isBundleFile(basename($rel))) {
                $refs[$rel] = true;
            }
        }
    }
    return array_keys($refs);
}

function ensureDirectory($dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    // Criar .htaccess para bloquear acesso HTTP
    $htaccess = $dir . '/.htaccess';
    if (!file_exists($htaccess)) {
        file_put_contents($htaccess, "Require all denied\n");
    }
}

function removeTempDir($dir) {
    if ($dir === '' || $dir === '/' || $dir === '.' || $dir === '..') {
        return;
    }
    if (!is_dir($dir)) {
        if (is_file($dir) || is_link($dir)) {
            @unlink($dir);
        }
        return;
    }

    // HostGator / shared hosting: system()/exec() costumam estar desabilitados.
    $items = @scandir($dir);
    if ($items === false) {
        return;
    }
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        $path = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($path) && !is_link($path)) {
            removeTempDir($path);
        } else {
            @unlink($path);
        }
    }
    @rmdir($dir);
}

$tempDir = null;

try {
    // 7. Obter diretório temporário (sys_get_temp_dir() fallback)
    $tempBase = sys_get_temp_dir();
    $tempDir = $tempBase . '/instabio_update_' . uniqid('', true);
    if (!is_writable($tempBase)) {
        $fallbackBase = __DIR__ . '/.update-tmp';
        ensureDirectory($fallbackBase);
        $tempDir = $fallbackBase . '/' . uniqid('', true);
        editor_update_log('warn', 'apply temp_fallback', ['tempDir' => $tempDir]);
    }
    ensureDirectory($tempDir);

    // 8. Chamar a API da plataforma para obter metadados do ZIP (URL assinada + SHA)
    $url = editor_platform_api_url($config['api'], 'updates/package');
    $payload = editor_license_api_payload();
    $result = editor_platform_post_json($url, $payload);

    if (!isset($result['ok']) || $result['ok'] !== true) {
        $error = $result['error'] ?? 'Falha ao obter pacote de atualização.';
        throw new Exception('Falha ao obter pacote: ' . $error);
    }

    $downloadUrl = $result['url'] ?? null;
    $expectedSha = $result['sha256'] ?? null;
    $newVersion = $result['version'] ?? null;

    if (!$downloadUrl || !$expectedSha || !$newVersion) {
        throw new Exception('Dados do pacote incompletos.');
    }

    editor_update_log('info', 'apply package_meta', [
        'version' => $newVersion,
        'sha256' => $expectedSha,
        'size' => $result['size'] ?? null,
        'url' => $downloadUrl,
    ]);

    // 9. Baixar o ZIP para o temp
    $zipPath = $tempDir . '/package.zip';
    $fp = fopen($zipPath, 'w+');
    if ($fp === false) {
        throw new Exception('Não foi possível criar arquivo temporário.');
    }
    $ch = curl_init($downloadUrl);
    curl_setopt($ch, CURLOPT_TIMEOUT, 600);
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $curlOk = curl_exec($ch);
    $curlErr = curl_error($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fp);

    $zipSize = file_exists($zipPath) ? (int) filesize($zipPath) : 0;
    if ($curlOk === false || $httpCode !== 200 || $zipSize === 0) {
        throw new Exception('Falha no download do pacote.');
    }

    // 10. Validar SHA-256
    $actualSha = hash_file('sha256', $zipPath);
    if ($actualSha !== $expectedSha) {
        editor_update_log('error', 'apply checksum_mismatch', [
            'expected' => $expectedSha,
            'actual' => $actualSha,
            'size' => $zipSize,
        ]);
        throw new Exception('Checksum do pacote não confere.');
    }

    // 11. Extrair ZIP
    $extractDir = $tempDir . '/extracted';
    mkdir($extractDir, 0755, true);
    $zip = new ZipArchive();
    $zipOpen = $zip->open($zipPath);
    if ($zipOpen !== true) {
        throw new Exception('Não foi possível abrir o arquivo ZIP.');
    }
    if (!$zip->extractTo($extractDir)) {
        $zip->close();
        throw new Exception('Falha ao extrair o arquivo ZIP.');
    }
    $zip->close();

    // 12. Validar manifest.json interno
    $manifestPath = $extractDir . '/manifest.json';
    if (!file_exists($manifestPath)) {
        throw new Exception('Pacote inválido: manifest.json ausente.');
    }
    $manifest = json_decode(file_get_contents($manifestPath), true);
    if (!$manifest || !isset($manifest['version']) || $manifest['version'] !== $newVersion) {
        throw new Exception('Pacote inválido: versão não confere.');
    }

    // 13. Preparar backup
    $backupDir = __DIR__ . '/.update-backup/' . date('Ymd_His');
    ensureDirectory($backupDir);

    $siteRoot = dirname(__DIR__);
    $editorRoot = __DIR__;

    $editorSkip = [
        'auth.config.php',
        'platform-api.json',
        'update-state.json',
        'update.log',
        'update.log.1',
        '.update-tmp',
        '.update-backup',
    ];

    editor_update_log('info', 'apply backup_start', ['backupDir' => $backupDir]);

    // Gate genérico: qualquer .php na raiz do pacote site/ (não hardcodar nomes —
    // senão update-apply antigo pula arquivos novos como analytics-track.php).
    $siteSource = $extractDir . '/site';
    if (!is_dir($siteSource)) {
        throw new Exception('Pacote inválido: pasta site/ ausente.');
    }

    $siteFilesToBackup = array_merge(
        sitePackageRootFilesToApply($siteRoot),
        sitePackageRootFilesToApply($siteSource),
        ['assets/'],
    );
    $siteFilesToBackup = array_values(array_unique($siteFilesToBackup));
    foreach ($siteFilesToBackup as $rel) {
        $src = $siteRoot . '/' . $rel;
        if (file_exists($src)) {
            $dest = $backupDir . '/site/' . $rel;
            if (is_dir($src)) {
                copyDirExcept($src, $dest, []);
            } else {
                copyFile($src, $dest);
            }
        }
    }
    $editorDest = $backupDir . '/editor';
    copyDirExcept($editorRoot, $editorDest, $editorSkip);

    // 15. Aplicar atualização (site) — todos os .php da raiz do pacote + estáticos
    $siteCopyFailures = [];
    copySitePackageRoot($siteSource, $siteRoot, $siteCopyFailures);
    $srcAssets = $siteSource . '/assets';
    $dstAssets = $siteRoot . '/assets';
    if (is_dir($srcAssets)) {
        if (!is_dir($dstAssets) && !@mkdir($dstAssets, 0755, true) && !is_dir($dstAssets)) {
            $siteCopyFailures[] = 'assets/';
        } else {
            removeBundleFiles($dstAssets);
            $assetFiles = scandir($srcAssets);
            if ($assetFiles === false) {
                $siteCopyFailures[] = 'assets/';
            } else {
                foreach ($assetFiles as $file) {
                    if ($file === '.' || $file === '..') continue;
                    if (isBundleFile($file)) {
                        if (!copyFile($srcAssets . '/' . $file, $dstAssets . '/' . $file)) {
                            $siteCopyFailures[] = 'assets/' . $file;
                        }
                    }
                }
            }
        }
    }

    // Bio pública: index.html + bundles referenciados DEVEM bater com o pacote.
    // Qualquer falha parcial aborta — senão a versão sobe e a bio fica antiga/quebrada.
    $newIndex = $siteSource . '/index.html';
    if (!is_file($newIndex)) {
        throw new Exception('Pacote inválido: site/index.html ausente.');
    }
    $expected = @hash_file('sha256', $newIndex);
    $actual = @hash_file('sha256', $siteRoot . '/index.html');
    if ($expected === false || $actual !== $expected) {
        $siteCopyFailures[] = 'index.html';
    }
    foreach (siteBundlesReferencedInHtml($newIndex) as $rel) {
        $pkgFile = $siteSource . '/' . $rel;
        $dstFile = $siteRoot . '/' . $rel;
        if (!is_file($pkgFile)) {
            $siteCopyFailures[] = $rel . ' (ausente no pacote)';
            continue;
        }
        $exp = @hash_file('sha256', $pkgFile);
        $act = @hash_file('sha256', $dstFile);
        if ($exp === false || $act !== $exp) {
            $siteCopyFailures[] = $rel;
        }
    }
    verifySitePackageRoot($siteSource, $siteRoot, $siteCopyFailures);
    if (!empty($siteCopyFailures)) {
        $unique = array_values(array_unique($siteCopyFailures));
        editor_update_log('error', 'apply site_not_written', [
            'siteRoot' => $siteRoot,
            'failures' => $unique,
            'writable' => is_writable($siteRoot),
            'assetsWritable' => is_dir($dstAssets) ? is_writable($dstAssets) : false,
        ]);
        throw new Exception(
            'A bio pública não pôde ser atualizada por completo ('
            . implode(', ', array_slice($unique, 0, 5))
            . (count($unique) > 5 ? '…' : '')
            . '). Verifique a permissão de escrita em '
            . $siteRoot
            . ' e em assets/. A versão NÃO foi alterada — tente de novo após corrigir as permissões.'
        );
    }

    // 16. Aplicar atualização (editor)
    $editorSource = $extractDir . '/editor';
    if (!is_dir($editorSource)) {
        throw new Exception('Pacote inválido: pasta editor/ ausente.');
    }
    $editorAssets = $editorRoot . '/assets';
    if (is_dir($editorAssets)) {
        // Remove TODOS os JS/CSS antigos (EditorApp-*, icons-*, pageMeta-*, …)
        removeBundleFiles($editorAssets, true);
    }
    $editorFailures = [];
    copyDirExcept($editorSource, $editorRoot, $editorSkip, $editorFailures);
    if (!empty($editorFailures)) {
        editor_update_log('error', 'apply editor_partial', [
            'editorRoot' => $editorRoot,
            'failures' => $editorFailures,
            'writable' => is_writable($editorRoot),
        ]);
        throw new Exception(
            'O editor não pôde ser atualizado por completo ('
            . implode(', ', array_slice($editorFailures, 0, 5))
            . (count($editorFailures) > 5 ? '…' : '')
            . '). A versão NÃO foi alterada. Verifique permissões em editor/ e editor/assets/.'
        );
    }

    // Reaplica a raiz do site depois do editor: cobre o caso em que o update-apply
    // que iniciou este request era antigo (lista fixa sem analytics-track.php etc.).
    // O pacote ainda está extraído; a cópia é idempotente.
    $siteResyncFailures = [];
    copySitePackageRoot($siteSource, $siteRoot, $siteResyncFailures);
    verifySitePackageRoot($siteSource, $siteRoot, $siteResyncFailures);
    if (!empty($siteResyncFailures)) {
        $unique = array_values(array_unique($siteResyncFailures));
        editor_update_log('error', 'apply site_resync_failed', [
            'siteRoot' => $siteRoot,
            'failures' => $unique,
        ]);
        throw new Exception(
            'Gate da bio incompleto após sincronizar ('
            . implode(', ', array_slice($unique, 0, 5))
            . '). Verifique permissão de escrita na raiz do site.'
        );
    }

    // 17. Atualizar update-state.json (só depois de bio + editor ok)
    $stateFile = $editorRoot . '/update-state.json';
    $oldState = [];
    if (file_exists($stateFile)) {
        $oldState = json_decode(file_get_contents($stateFile), true) ?: [];
    }
    $newState = [
        'version' => $newVersion,
        'updatedAt' => date('c'),
        'channel' => $oldState['channel'] ?? 'stable',
        'previousVersion' => $oldState['version'] ?? null,
    ];
    if (file_put_contents($stateFile, json_encode($newState, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n") === false) {
        throw new Exception('Não foi possível gravar update-state.json após a atualização.');
    }

    removeTempDir($tempDir);
    $tempDir = null;

    editor_update_log('info', 'apply success', [
        'version' => $newVersion,
        'previousVersion' => $newState['previousVersion'],
        'backupDir' => $backupDir,
    ]);

    echo json_encode([
        'ok' => true,
        'version' => $newVersion,
        'updatedAt' => $newState['updatedAt'],
    ]);
    exit;
} catch (Throwable $e) {
    if ($tempDir) {
        removeTempDir($tempDir);
    }

    $public = $e->getMessage();
    // Mensagens genéricas para falhas de download (detalhe no log)
    if (strpos($public, 'Falha no download') !== false) {
        editor_update_log('error', 'apply download_failed', [
            'http' => $httpCode ?? null,
            'curlOk' => isset($curlOk) ? (bool) $curlOk : null,
            'curlErr' => $curlErr ?? null,
            'size' => $zipSize ?? null,
            'url' => $downloadUrl ?? null,
        ]);
    } elseif (strpos($public, 'obter pacote') !== false || strpos($public, 'Dados do pacote') !== false) {
        editor_update_log('error', 'apply package_api_failed', [
            'message' => $e->getMessage(),
            'http_status' => $result['http_status'] ?? null,
            'api_error' => $result['error'] ?? null,
        ]);
    } else {
        editor_update_log('error', 'apply failed', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);
    }

    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $public], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
