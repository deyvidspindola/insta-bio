# Fase D — instruções de instalação (apply)

## O que foi testado neste ambiente e o que NÃO foi

- ✅ `editor/php/update-apply.php` — sintaxe PHP validada com `php -l`; estrutura segue o padrão `save.php` e `PADROES-ATUALIZACOES-REMOTAS.md`.
- ✅ `editor/src/lib/updates.ts` (adição de `applyUpdate`) — compila com `tsc --strict`.
- ✅ `editor/src/components/UpdatesCard.tsx` (com botão "Atualizar agora") — revisado manualmente.
- ⚠️ **Não testado com ZIP real e extração** — você precisa validar em um ambiente com PHP `ZipArchive` e permissões de escrita.
- ⚠️ **A API da plataforma ainda não está pronta** para fornecer a URL assinada; o código usa um placeholder que você deverá substituir quando a API estiver implementada (ou usar mock).

---

## 1. Arquivos deste pacote

| Arquivo | Destino no monorepo | Ação |
|---------|----------------------|------|
| `editor/php/update-apply.php` | `editor/php/update-apply.php` | **Criar** |
| `editor/src/lib/updates.ts` | `editor/src/lib/updates.ts` | **Editar** (adicionar `applyUpdate`) |
| `editor/src/components/UpdatesCard.tsx` | `editor/src/components/UpdatesCard.tsx` | **Editar** (adicionar botão "Atualizar agora" e estado de aplicação) |
| `editor/.update-tmp/.htaccess` | `editor/.update-tmp/.htaccess` | **Criar** (pasta e arquivo) |
| `editor/.update-backup/.htaccess` | `editor/.update-backup/.htaccess` | **Criar** (pasta e arquivo) |

---

## 2. Conteúdo dos novos arquivos

### 2.1. `editor/php/update-apply.php` (criar)

```php
<?php
/**
 * POST editor/update-apply.php (rota pública: api/update/apply)
 *
 * Fase D — baixa o ZIP, valida SHA-256, faz backup e aplica a atualização.
 * Preserva arquivos sensíveis, limpa bundles antigos e atualiza o estado local.
 *
 * Requisitos:
 * - Sessão do editor ativa
 * - Cliente ativo (client-guard)
 * - Cliente NÃO pode ser da plataforma (sem platform-api.json)
 * - license.config.php com slug/token válidos
 * - ZipArchive disponível
 */

require __DIR__ . '/auth.config.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

// 1. Método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

// 2. Autenticação
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado']);
    exit;
}

// 3. Clientes da plataforma
if (is_file(__DIR__ . '/platform-api.json')) {
    http_response_code(403);
    echo json_encode(['error' => 'Atualizações gerenciadas pela plataforma.']);
    exit;
}

// 4. Carregar licença
if (!function_exists('editor_load_license_config')) {
    require_once __DIR__ . '/platform-auth.php';
}
$config = editor_load_license_config();
if ($config === null || empty($config['slug']) || empty($config['token'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Atualização remota indisponível: licença não configurada.']);
    exit;
}

// 5. Verificar ZipArchive
if (!class_exists('ZipArchive')) {
    http_response_code(500);
    echo json_encode(['error' => 'PHP ZipArchive não disponível no servidor.']);
    exit;
}

// 6. Funções auxiliares (espelham sync-clients-template.mjs)
function isBundleFile($name) {
    return preg_match('/^(index|main|preview)-[A-Za-z0-9_-]+\.(js|css)$/', $name) === 1;
}

function removeBundleFiles($dir) {
    if (!is_dir($dir)) return;
    $files = scandir($dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        $path = $dir . '/' . $file;
        if (is_file($path) && isBundleFile($file)) {
            unlink($path);
        }
    }
}

function copyDirExcept($src, $dest, $skipNames = []) {
    if (!is_dir($dest)) mkdir($dest, 0755, true);
    $items = scandir($src);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        if (in_array($item, $skipNames)) continue;
        $srcPath = $src . '/' . $item;
        $destPath = $dest . '/' . $item;
        if (is_dir($srcPath)) {
            copyDirExcept($srcPath, $destPath, $skipNames);
        } else {
            copy($srcPath, $destPath);
        }
    }
}

function copyFile($src, $dest) {
    $dir = dirname($dest);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    copy($src, $dest);
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

// 7. Obter diretório temporário (sys_get_temp_dir() fallback)
$tempBase = sys_get_temp_dir();
$tempDir = $tempBase . '/instabio_update_' . uniqid();
if (!is_writable($tempBase)) {
    // Fallback dentro do editor
    $tempDir = __DIR__ . '/.update-tmp';
    ensureDirectory($tempDir);
    $tempDir = $tempDir . '/' . uniqid();
}
ensureDirectory(dirname($tempDir));

// 8. Chamar a API da plataforma para obter metadados do ZIP (URL assinada + SHA)
try {
    $url = editor_platform_api_url($config['api'], 'updates/package');
    $payload = [
        'slug' => $config['slug'],
        'token' => $config['token'],
    ];
    $result = editor_platform_post_json($url, $payload);

    if (!isset($result['ok']) || $result['ok'] !== true) {
        $error = $result['error'] ?? 'Falha ao obter pacote de atualização.';
        throw new Exception($error);
    }

    // Espera-se: { ok: true, url: 'https://.../insta-bio-X.zip', sha256: '...', version: '1.4.2', size: ... }
    $downloadUrl = $result['url'] ?? null;
    $expectedSha = $result['sha256'] ?? null;
    $newVersion = $result['version'] ?? null;

    if (!$downloadUrl || !$expectedSha || !$newVersion) {
        throw new Exception('Dados do pacote incompletos.');
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erro ao obter pacote: ' . $e->getMessage()]);
    exit;
}

// 9. Baixar o ZIP para o temp
$zipPath = $tempDir . '/package.zip';
$fp = fopen($zipPath, 'w+');
$ch = curl_init($downloadUrl);
curl_setopt($ch, CURLOPT_TIMEOUT, 600);
curl_setopt($ch, CURLOPT_FILE, $fp);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
fclose($fp);

if ($httpCode !== 200 || !file_exists($zipPath) || filesize($zipPath) === 0) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha no download do pacote.']);
    // Limpeza
    if (is_dir($tempDir)) {
        system('rm -rf ' . escapeshellarg($tempDir));
    }
    exit;
}

// 10. Validar SHA-256
$actualSha = hash_file('sha256', $zipPath);
if ($actualSha !== $expectedSha) {
    http_response_code(500);
    echo json_encode(['error' => 'Checksum do pacote não confere.']);
    system('rm -rf ' . escapeshellarg($tempDir));
    exit;
}

// 11. Extrair ZIP
$extractDir = $tempDir . '/extracted';
mkdir($extractDir, 0755, true);
$zip = new ZipArchive();
if ($zip->open($zipPath) !== true) {
    http_response_code(500);
    echo json_encode(['error' => 'Não foi possível abrir o arquivo ZIP.']);
    system('rm -rf ' . escapeshellarg($tempDir));
    exit;
}
$zip->extractTo($extractDir);
$zip->close();

// 12. Validar manifest.json interno
$manifestPath = $extractDir . '/manifest.json';
if (!file_exists($manifestPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Pacote inválido: manifest.json ausente.']);
    system('rm -rf ' . escapeshellarg($tempDir));
    exit;
}
$manifest = json_decode(file_get_contents($manifestPath), true);
if (!$manifest || !isset($manifest['version']) || $manifest['version'] !== $newVersion) {
    http_response_code(500);
    echo json_encode(['error' => 'Pacote inválido: versão não confere.']);
    system('rm -rf ' . escapeshellarg($tempDir));
    exit;
}

// 13. Preparar backup
$backupDir = __DIR__ . '/.update-backup/' . date('Ymd_His');
ensureDirectory($backupDir);

// Definir caminhos
$siteRoot = dirname(__DIR__); // raiz do cliente (onde está index.html)
$editorRoot = __DIR__;       // pasta editor/

// 14. Fazer backup dos arquivos que serão substituídos (site + editor)
// Backup do site (apenas arquivos do template, não dados)
$siteFilesToBackup = ['index.html', 'favicon.svg', 'icons.svg', 'logo-instabio.svg', 'suspended.html', 'assets/'];
foreach ($siteFilesToBackup as $rel) {
    $src = $siteRoot . '/' . $rel;
    if (file_exists($src)) {
        $dest = $backupDir . '/site/' . $rel;
        if (is_dir($src)) {
            copyDirExcept($src, $dest, []); // copia tudo recursivamente
        } else {
            copyFile($src, $dest);
        }
    }
}
// Backup do editor (tudo, menos dados sensíveis)
$editorBackupSkip = ['auth.config.php', 'platform-api.json', 'update-state.json'];
$editorSrc = $editorRoot;
$editorDest = $backupDir . '/editor';
copyDirExcept($editorSrc, $editorDest, $editorBackupSkip);

// 15. Aplicar atualização (site)
$siteSource = $extractDir . '/site';
if (is_dir($siteSource)) {
    // Copiar arquivos estáticos (index.html, etc.)
    $staticFiles = ['index.html', 'favicon.svg', 'icons.svg', 'logo-instabio.svg', 'suspended.html'];
    foreach ($staticFiles as $file) {
        $src = $siteSource . '/' . $file;
        if (file_exists($src)) {
            copyFile($src, $siteRoot . '/' . $file);
        }
    }
    // Copiar assets/ (substituir bundles antigos, preservar imagens do cliente)
    $srcAssets = $siteSource . '/assets';
    $dstAssets = $siteRoot . '/assets';
    if (is_dir($srcAssets)) {
        if (!is_dir($dstAssets)) mkdir($dstAssets, 0755, true);
        // Remover bundles antigos
        removeBundleFiles($dstAssets);
        // Copiar apenas bundles novos (index-*.js|css)
        $assetFiles = scandir($srcAssets);
        foreach ($assetFiles as $file) {
            if ($file === '.' || $file === '..') continue;
            if (isBundleFile($file)) {
                copyFile($srcAssets . '/' . $file, $dstAssets . '/' . $file);
            }
            // Não copiar imagens (preservar as do cliente)
        }
    }
}

// 16. Aplicar atualização (editor)
$editorSource = $extractDir . '/editor';
if (is_dir($editorSource)) {
    // Remover bundles antigos do editor/assets/
    $editorAssets = $editorRoot . '/assets';
    if (is_dir($editorAssets)) {
        removeBundleFiles($editorAssets);
    }
    // Copiar todo o conteúdo do editor, exceto arquivos sensíveis
    copyDirExcept($editorSource, $editorRoot, ['auth.config.php', 'platform-api.json', 'update-state.json']);
}

// 17. Atualizar update-state.json
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
file_put_contents($stateFile, json_encode($newState, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");

// 18. Limpar temp
system('rm -rf ' . escapeshellarg($tempDir));

// 19. Resposta de sucesso
echo json_encode([
    'ok' => true,
    'version' => $newVersion,
    'updatedAt' => $newState['updatedAt'],
]);
exit;
```
### 2.2. editor/src/lib/updates.ts — adicionar a função applyUpdate
Adicione este bloco abaixo da função checkForUpdates:

```ts
/**
 * Fase D — aplica a atualização disponível.
 * Chama o endpoint updateApply (PHP) que baixa, valida, faz backup e substitui arquivos.
 */
export async function applyUpdate(): Promise<{
  ok: boolean
  version: string
  updatedAt: string
}> {
  const res = await fetch(ENDPOINTS.updateApply, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    cache: 'no-store',
  })

  const data = (await res.json().catch(() => null)) as {
    ok?: boolean
    error?: string
    version?: string
    updatedAt?: string
  } | null

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Falha ao aplicar atualização')
  }

  return {
    ok: true,
    version: data.version ?? 'desconhecida',
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}
```
Também não esqueça de adicionar a constante updateApply no ENDPOINTS em `editor/src/lib/endpoints.ts`:

```ts
export const ENDPOINTS = {
  // ...
  updateStatus: 'api/update/status',
  updateCheck: 'api/update/check',
  updateApply: 'api/update/apply',   // NOVO — Fase D
} as const
```
### 2.3. `editor/src/components/UpdatesCard.tsx` — editar para incluir o botão "Atualizar agora"
Substitua a seção que exibe `updateAvailable` para incluir um botão de aplicar. No código abaixo, mantive a estrutura anterior e adicionei:

- Estado `applying`
- Handler `handleApply`
- Botão "Atualizar agora" que aparece quando `updateAvailable` for `true`
- Bloqueio do botão durante `applying`
- Atualização da versão e data após sucesso

Substitua a parte de `updateAvailable` e adicione os novos estados:

```tsx
// Dentro do componente, adicione os estados:
const [applying, setApplying] = useState(false)

// Handler para aplicar
async function handleApply() {
  setApplying(true)
  setCheckError(null)
  setCheckMessage(null)
  try {
    const result = await applyUpdate()
    // Atualiza a versão exibida e a data
    setState(prev => prev ? { ...prev, version: result.version, updatedAt: result.updatedAt } : null)
    setCheckMessage(`Atualização concluída! Versão ${result.version}`)
    setUpdateAvailable(false) // esconde o botão
  } catch (err) {
    setCheckError(err instanceof Error ? err.message : 'Erro ao aplicar atualização')
  } finally {
    setApplying(false)
  }
}
```
E no JSX, dentro do bloco `{updateAvailable && latestVersion && ( ... )}`, substitua o parágrafo `(A aplicação ...)` pelo botão:

```tsx
{updateAvailable && latestVersion && (
  <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
    <p className="text-foreground font-medium">
      📦 Versão {latestVersion} disponível
    </p>
    <p className="mt-1 text-muted-foreground">
      Changelog: {changelog}
    </p>
    <button
      type="button"
      className="mt-2 btn-primary inline-flex items-center gap-2 px-3 py-2 text-xs"
      onClick={() => void handleApply()}
      disabled={applying}
    >
      {applying ? 'Aplicando…' : 'Atualizar agora'}
    </button>
  </div>
)}
```
Importante: lembre-se de importar `applyUpdate` no topo:

```tsx
import { fetchUpdateStatus, checkForUpdates, applyUpdate, type UpdateState } from '../lib/updates'
```
### 2.4. Pastas protegidas (`.update-tmp` e `.update-backup`)
Crie as pastas com `.htaccess` para bloquear acesso HTTP. Execute no terminal dentro da pasta `editor/`:

```bash
mkdir -p .update-tmp .update-backup
echo "Require all denied" > .update-tmp/.htaccess
echo "Require all denied" > .update-backup/.htaccess
```
Ou, se preferir, crie manualmente os arquivos com o conteúdo:

```text
Require all denied
```
Isso impede que terceiros acessem backups ou arquivos temporários.

## 3. Configuração do .htaccess (rota api/update/apply)
Adicione a regra de rewrite, caso seu .htaccess não seja genérico:

```apache
RewriteRule ^api/update/apply$ update-apply.php [L]
```
Exemplo completo:

```apache
RewriteEngine On
RewriteRule ^api/auth/session$ session.php [L]
RewriteRule ^api/bio/paths$ paths.php [L]
RewriteRule ^api/update/status$ update-status.php [L]
RewriteRule ^api/update/check$ update-check.php [L]
RewriteRule ^api/update/apply$ update-apply.php [L]   # Fase D
```

## 4. Mock temporário para a API de pacote (até implementar no painel)
No `update-apply.php`, enquanto a API `updates/package` não estiver pronta, você pode simular a resposta. Substitua o bloco try que chama `editor_platform_post_json` por:

```php
// MOCK — remover quando a API estiver pronta
$mockPackage = [
    'ok' => true,
    'url' => 'https://seusite.com/updates/insta-bio-1.4.2.zip', // coloque uma URL real ou local
    'sha256' => hash_file('sha256', __DIR__ . '/../dist/updates/insta-bio-1.4.2.zip'), // se tiver o ZIP local
    'version' => '1.4.2',
];
$result = $mockPackage;
```
Não se esqueça de remover o mock após a integração com o painel.

## 5. Checklist de teste (humano)
- `php -l editor/php/update-apply.php` sem erro de sintaxe.
- `editor/src/lib/updates.ts` compila com `tsc` (ou build do editor).
- `editor/src/components/UpdatesCard.tsx` compila sem erros.
- Pastas `.update-tmp` e `.update-backup` criadas com `.htaccess` apropriados.
- Cliente single-tenant (sem `platform-api.json`):
  - Após buscar atualizações e encontrar uma nova versão, o botão "Atualizar agora" aparece.
  - Ao clicar, inicia o processo: mostra "Aplicando…" e depois "Atualização concluída!".
  - A versão exibida e a data são atualizadas.
  - O site e editor são atualizados com os novos arquivos.
  - `bio.json`, `assets`/ (imagens) e `auth.config.php` permanecem intactos.
  - Os bundles antigos (ex.: `index-OLDHASH.js`) são removidos.
  - Não há duplicação de pastas (ex.: `editor/editor/`).
- Cliente plataforma (com `platform-api.json`):
  - O botão não aparece (nem o de buscar, nem o de aplicar).
- Erros:
  - Sem ZipArchive → mensagem clara.
  - SHA inválido → erro e limpeza do temp.
  - Falha no download → erro.
  - Sessão expirada → 401.
- Backup:
  - Após aplicar, a pasta editor/.update-backup/ contém os arquivos anteriores (site e editor).
  - O backup inclui index.html, assets/, editor/* (exceto dados sensíveis).

## 6. O que esta fase NÃO faz (de propósito)
- Não implementa o endpoint updates/package no painel — isso é tarefa da Fase E.
- Não faz rollback automático (será opcional).
- Não tem modo manutenção ou fila de atualizações.
- Não bloqueia o editor durante a atualização (apenas desabilita o botão).
- Não trata timeouts longos para downloads grandes (apenas o CURL_TIMEOUT de 600s).

## 7. Próximos passos
Após validar a Fase D, a Fase E (documentação e checklist de release) pode ser realizada, além de implementar o endpoint `updates/check` e `updates/package` no painel da plataforma para tornar o fluxo completo.

Quando estiver pronto, peça o detalhamento da Fase E.