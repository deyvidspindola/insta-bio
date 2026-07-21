# Padrões de código — atualizações remotas

> **Para quem:** Claude / GPT / agente **sem** o monorepo no ambiente.  
> **Uso:** anexe este arquivo **junto** com `ATUALIZACOES-REMOTAS.md` e `PROMPT-ATUALIZACOES-REMOTAS.md`.  
> **Objetivo:** gerar PHP, React e `.mjs` no **mesmo estilo** do insta-bio — sem reinventar nomes, imports ou a lógica de sync.

---

## 1. Convenções do monorepo (obrigatório)

| Item | Valor real |
|------|------------|
| Gerenciador | **npm** (workspaces por pasta: `bio/`, `editor/`, `panel/`, `site/`) |
| Módulos Node | **ESM** — `"type": "module"` na raiz; scripts em `scripts/*.mjs` |
| Imports Node | `import fs from 'node:fs'`, `import path from 'node:path'`, `import { fileURLToPath } from 'node:url'` |
| ROOT do script | `path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')` |
| Sem TypeScript nos scripts | `.mjs` com JS puro (sem tipagem) |
| React editor | TypeScript + Vite; componentes em `editor/src/components/` |
| Fetch API | `credentials: 'include'`, `cache: 'no-store'` quando for sessão/estado |
| Endpoints editor | paths **sem** `.php` no front: `api/...` (Apache reescreve) — ver `editor/src/lib/endpoints.ts` |
| PHP editor | arquivos em `editor/php/*.php`; no deploy HostGator ficam em `{cliente}/editor/*.php` |
| JSON PHP | `header('Content-Type: application/json');` + `echo json_encode([...])` |
| Auth editor | `session_start()` + `$_SESSION['user']`; sempre `require_client_active()` |
| Licença single-tenant | `license.config.php` na **raiz do cliente** (`LICENSE_SLUG`, `LICENSE_TOKEN`, `LICENSE_API`) |
| Detecção plataforma | existência de `editor/platform-api.json` (ou `remoteAuth` via auth) → **sem** botão de update |
| Idioma UI / erros | português do Brasil |

### Scripts npm relevantes (raiz `package.json`)

```json
{
  "type": "module",
  "scripts": {
    "build": "npm run build --prefix bio",
    "editor:hostgator": "npm run build:hostgator --prefix editor",
    "build:package": "node scripts/package-deploy.mjs",
    "build:template": "node scripts/package-template.mjs",
    "sync:clients": "node scripts/sync-clients-template.mjs"
  }
}
```

**Novo script a adicionar (Fase A):** `"build:update-package": "node scripts/build-update-package.mjs"`

### Árvores de build (não inventar outros nomes)

| Artefato | Caminho |
|----------|---------|
| Bio build | `dist/` (raiz) |
| Editor HostGator | `editor/dist/` |
| Pacote FTP single-tenant | `release/` (= `dist/` + `release/editor/`) |
| Template plataforma | `platform-template/_template/` |
| Pacote de update (novo) | `dist/updates/insta-bio-{version}.zip` + `dist/updates/updates.json` |

### Layout do ZIP de update (espelha single-tenant)

```
insta-bio-1.4.2.zip
├── manifest.json
├── site/          ← conteúdo de dist/ (bio pública)
│   ├── index.html
│   ├── assets/    ← só bundles Vite (index-*.js/css), NÃO imagens do cliente
│   └── …
└── editor/        ← conteúdo de editor/dist/ SEM auth.config.php do cliente
    ├── index.html
    ├── assets/
    ├── login.php
    ├── save.php
    └── …
```

**Aplicação no cliente (igual sync do painel):**

| No ZIP | No servidor do cliente |
|--------|------------------------|
| `site/*` (exceto dados) | raiz do site (`public_html/` ou subpasta) |
| `site/assets/index-*.js\|css` | `{raiz}/assets/` (após limpar bundles antigos) |
| `editor/*` | `{raiz}/editor/` |
| — | **nunca** criar `editor/editor/` |

---

## 2. Lógica canônica a espelhar — `sync-clients-template.mjs`

O apply PHP **deve** reproduzir esta lógica (não inventar outra). Trechos reais do projeto:

### Helpers de cópia e bundles

```js
// ESM — padrão de TODOS os scripts/ do monorepo
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function copyDirExcept(src, dest, skipNames = new Set()) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipNames.has(entry.name)) continue
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDirExcept(from, to, skipNames)
    else copyFile(from, to)
  }
}

function isBundleFile(name) {
  return (
    /^index-[A-Za-z0-9_-]+\.(js|css)$/.test(name) ||
    /^main-[A-Za-z0-9_-]+\.(js|css)$/.test(name)
  )
  // Nota: preview do editor usa preview-*.js — no apply PHP, limpar também
  // preview-[A-Za-z0-9_-]+\.(js|css) na pasta editor/assets/
}

function removeBundleFiles(dir) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    if (isBundleFile(name)) fs.unlinkSync(path.join(dir, name))
  }
}
```

### Sync bio (raiz do cliente)

```js
function syncClientBio(clientDir, templateDir) {
  // Arquivos estáticos do template (não apaga bio.json / assets de imagem)
  for (const name of [
    'index.html',
    'suspended.html',
    'favicon.svg',
    'icons.svg',
    'logo-instabio.svg',
  ]) {
    const src = path.join(templateDir, name)
    if (fs.existsSync(src)) copyFile(src, path.join(clientDir, name))
  }

  const tplAssets = path.join(templateDir, 'assets')
  const dstAssets = path.join(clientDir, 'assets')
  fs.mkdirSync(dstAssets, { recursive: true })

  removeBundleFiles(dstAssets) // remove index-OLDHASH.js/css

  for (const name of fs.readdirSync(tplAssets)) {
    if (isBundleFile(name)) {
      copyFile(path.join(tplAssets, name), path.join(dstAssets, name))
    }
    // NÃO copia imagens do template para assets/ do cliente
  }
}
```

### Sync editor (preserva auth)

```js
function syncClientEditor(clientDir, templateDir) {
  const tplEditor = path.join(templateDir, 'editor')
  const dstEditor = path.join(clientDir, 'editor')
  if (!fs.existsSync(tplEditor)) return

  removeBundleFiles(path.join(dstEditor, 'assets'))

  // NUNCA sobrescrever auth.config.php
  copyDirExcept(tplEditor, dstEditor, new Set(['auth.config.php']))
}
```

### O que o sync NÃO toca (apply PHP idem)

- `bio.json`, `bio.draft.json`, `bio-path.json`
- imagens em `assets/` (só remove/substitui bundles `index-*` / `main-*`)
- `editor/auth.config.php`
- `editor/platform-api.json` (se existir — skip no copy)
- `editor/update-state.json` (reescrito só no final do apply)
- `.suspended`, `license.config.php`, `client-license.php`

---

## 3. Modelo MJS — `scripts/build-update-package.mjs` (Fase A)

Espelhar estilo de `package-deploy.mjs` / `package-template.mjs`:

```js
/**
 * Gera dist/updates/insta-bio-{version}.zip + updates.json
 * Uso: npm run build:update-package
 *
 * NÃO rodar em make dev-all.
 */
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
// Preferir Zip nativo via `archiver` só se já existir no projeto;
// senão: documentar uso de `zip` CLI ou adicionar dep — NÃO inventar CommonJS.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function readVersion() {
  // Preferir arquivo VERSION na raiz; fallback package.json "version"
  const versionFile = path.join(ROOT, 'VERSION')
  if (fs.existsSync(versionFile)) {
    return fs.readFileSync(versionFile, 'utf8').trim()
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
  return String(pkg.version || '0.0.0')
}

function sha256File(filePath) {
  const hash = createHash('sha256')
  hash.update(fs.readFileSync(filePath))
  return hash.digest('hex')
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

// Passos obrigatórios:
// 1. version = readVersion()
// 2. execSync builds (bio + editor:hostgator) — igual package-deploy.mjs
// 3. staging = dist/updates/_staging/{version}/site + editor
// 4. Remover do staging: auth.config.php, bio.json*, assets de imagem do cliente,
//    platform-api.json, update-state.json
// 5. Gerar manifest.json com lista de arquivos + sha256
// 6. Zipar → dist/updates/insta-bio-{version}.zip
// 7. Atualizar dist/updates/updates.json (latest + packages[version].url/sha256/size)
// 8. console.log caminhos gerados

console.log('→ build:update-package (esqueleto — completar zip/manifest)')
```

### `manifest.json` interno (contrato)

```json
{
  "version": "1.4.2",
  "layout": "single-tenant-v1",
  "siteRoot": "site",
  "editorRoot": "editor",
  "preserve": [
    "bio.json",
    "bio.draft.json",
    "bio-path.json",
    "assets/**",
    "editor/auth.config.php",
    "editor/platform-api.json",
    "editor/update-state.json"
  ],
  "files": [
    { "path": "site/index.html", "sha256": "…" },
    { "path": "editor/assets/index-abc123.js", "sha256": "…" }
  ]
}
```

### `update-state.json` (gravar no `package-deploy` / template)

```json
{
  "version": "1.4.2",
  "updatedAt": "2026-07-10T18:00:00Z",
  "channel": "stable",
  "previousVersion": null
}
```

Caminho no cliente: `editor/update-state.json`.

---

## 4. Modelo PHP — endpoints do editor

### Boilerplate real (copiar este cabeçalho)

Todo endpoint autenticado do editor segue isto (`save.php`):

```php
<?php
require __DIR__ . '/auth.config.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Não autenticado']);
  exit;
}

// … lógica …
echo json_encode(['ok' => true]);
```

### Licença / API da plataforma (já existe)

```php
// platform-auth.php — funções reais a reutilizar:
// editor_load_license_config(): ?array  → ['slug','token','api']
// editor_platform_api_url($licenseApi, $suffix): string
// editor_platform_post_json($url, $payload): array

$config = editor_load_license_config();
if ($config === null) {
  // Cliente legado sem license.config.php — update remoto não disponível
  http_response_code(400);
  echo json_encode(['error' => 'Atualização remota indisponível nesta instalação']);
  exit;
}

$url = editor_platform_api_url($config['api'], 'updates/check'); // ou updates/package
$result = editor_platform_post_json($url, [
  'slug' => $config['slug'],
  'token' => $config['token'],
  // host/deploy se a API exigir (igual license-check)
]);
```

### Detecção plataforma (sem botão)

```php
function editor_is_platform_client(): bool
{
  // PHP em {cliente}/editor/ → raiz do cliente = dirname(__DIR__) em alguns helpers;
  // em editor/php/ no repo, o deploy coloca PHP ao lado do index do editor.
  return is_file(__DIR__ . '/platform-api.json');
}
```

No React: tentar `fetch('platform-api.json')` (já em `auth.ts`) — se `remoteAuth` / arquivo existe → esconder botão.

### Esqueleto `update-status.php`

```php
<?php
require __DIR__ . '/auth.config.php';
require __DIR__ . '/client-guard.php';
require_client_active();
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Não autenticado']);
  exit;
}

$stateFile = __DIR__ . '/update-state.json';
$state = [
  'version' => 'desconhecida',
  'updatedAt' => null,
  'channel' => 'stable',
];

if (is_file($stateFile)) {
  $raw = json_decode((string) file_get_contents($stateFile), true);
  if (is_array($raw)) {
    $state = array_merge($state, $raw);
  }
}

echo json_encode([
  'ok' => true,
  'state' => $state,
  'platformManaged' => is_file(__DIR__ . '/platform-api.json'),
]);
```

### Esqueleto `update-check.php` / `update-apply.php`

- Mesmo cabeçalho de auth + `require_client_active()`.
- Se `platform-api.json` existir → `403` com mensagem “Atualizações gerenciadas pela plataforma.”
- Check/apply: POST JSON para API do painel com slug+token; só então usar URL assinada.
- Apply: temp em `sys_get_temp_dir()` ou `__DIR__ . '/.update-tmp/'` + `.htaccess` Deny; backup em `__DIR__ . '/.update-backup/'`.
- Após extrair ZIP: mapear `site/` → `dirname(__DIR__)` (raiz do cliente) e `editor/` → `__DIR__`, **pulando** lista `preserve`.
- Replicar `removeBundleFiles` + cópia só de bundles em `assets/`.
- No final: escrever `update-state.json`, apagar temp.

### Respostas JSON (contrato sugerido)

**status**
```json
{ "ok": true, "state": { "version": "1.4.1", "updatedAt": "…", "channel": "stable" }, "platformManaged": false }
```

**check (sucesso)**
```json
{
  "ok": true,
  "updateAvailable": true,
  "installed": "1.4.1",
  "latest": "1.4.2",
  "changelog": "…",
  "releasedAt": "…"
}
```

**apply (sucesso)**
```json
{ "ok": true, "version": "1.4.2", "updatedAt": "…" }
```

**erros:** `{ "error": "mensagem em PT-BR" }` + HTTP 4xx/5xx.

---

## 5. Modelo React — Configurações / updates

### Endpoints — estender `editor/src/lib/endpoints.ts`

```ts
// Mesmas rotas em dev (Vite) e produção (Apache reescreve para .php)
export const ENDPOINTS = {
  session: 'api/auth/session',
  // … existentes …
  paths: 'api/bio/paths',
  // NOVOS:
  updateStatus: 'api/update/status',
  updateCheck: 'api/update/check',
  updateApply: 'api/update/apply',
} as const
```

(O rewrite Apache já mapeia `api/...` → PHP; seguir o padrão existente em `editor` — **não** chamar `update-status.php` direto no front.)

### Lib — `editor/src/lib/updates.ts` (novo, espelhar `paths.ts`)

```ts
import { ENDPOINTS } from './endpoints'

export type UpdateState = {
  version: string
  updatedAt: string | null
  channel?: string
  previousVersion?: string | null
}

export type UpdateStatusResponse = {
  ok: boolean
  state: UpdateState
  platformManaged: boolean
}

export async function fetchUpdateStatus(): Promise<UpdateStatusResponse> {
  const res = await fetch(ENDPOINTS.updateStatus, {
    credentials: 'include',
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => null)) as
    | (UpdateStatusResponse & { error?: string })
    | null
  if (!res.ok) {
    throw new Error(data?.error ?? 'Não foi possível carregar a versão')
  }
  if (!data?.ok) {
    throw new Error(data?.error ?? 'Resposta inválida')
  }
  return data
}

export async function checkForUpdates(): Promise<{
  ok: boolean
  updateAvailable: boolean
  installed: string
  latest: string
  changelog?: string
}> {
  const res = await fetch(ENDPOINTS.updateCheck, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const data = (await res.json().catch(() => null)) as {
    ok?: boolean
    error?: string
    updateAvailable?: boolean
    installed?: string
    latest?: string
    changelog?: string
  } | null
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Falha ao buscar atualizações')
  }
  return {
    ok: true,
    updateAvailable: Boolean(data.updateAvailable),
    installed: data.installed ?? '',
    latest: data.latest ?? '',
    changelog: data.changelog,
  }
}
```

### UI — card em `AdvancedPanel.tsx` (padrão visual existente)

Classes e estrutura já usadas no painel:

```tsx
<div className="card">
  <h3 className="mb-1 text-sm font-semibold">Atualizações</h3>
  <p className="mb-4 text-xs text-muted-foreground">
    Versão do template instalado neste site.
  </p>

  {loading ? (
    <p className="text-xs text-muted-foreground">Carregando…</p>
  ) : (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <p>
          <span className="text-foreground">Versão:</span> {state?.version ?? 'desconhecida'}
        </p>
        <p className="mt-1">
          <span className="text-foreground">Última atualização:</span>{' '}
          {formatDate(state?.updatedAt) /* pt-BR */}
        </p>
      </div>

      {platformManaged ? (
        <p className="text-xs text-muted-foreground">
          Atualizações gerenciadas pela plataforma.
        </p>
      ) : (
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
          disabled={busy}
          onClick={() => void handleCheck()}
        >
          {busy ? 'Verificando…' : 'Buscar atualizações'}
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
      {status && <p className="text-xs text-emerald-400">{status}</p>}
    </div>
  )}
</div>
```

Regras UI:

- `useEffect` com flag `cancelled` (igual paths no `AdvancedPanel`).
- Estados: `idle | checking | downloading | applying | success | error` (texto simples; sem UI elaborada).
- Durante apply: desabilitar botões de save/publish se o `EditorApp` expuser callback — senão só desabilitar os botões deste card.
- Ícones: `lucide-react` (ex.: `RefreshCw`).
- Confirmação destrutiva: reutilizar `ConfirmDialog` se houver “Atualizar agora”.

---

## 6. Modelo PHP — API do painel (download autenticado)

Novos endpoints sob `panel/php/` (padrão `license-check.php`):

```php
<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';
// + platform_db_execute / platform_input_* se for query

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// 1. Ler slug + token (platform_json_input / sanitizers)
// 2. lookup_client_license(...) — reutilizar
// 3. Se status !== active → 403
// 4. Ler updates.json do disco (FORA do docroot público, se possível)
// 5. Devolver metadados + URL assinada OU stream do ZIP com auth
```

**Não** colocar `insta-bio-*.zip` em URL pública permanente.

Sugestão de rotas (alinhar ao rewrite do panel):

- `POST panel/api/updates/check`
- `POST panel/api/updates/package` (devolve URL assinada ou faz stream)

Payload de entrada (igual licença):

```json
{ "slug": "cliente", "token": "…", "host": "opcional", "deploy": "opcional" }
```

---

## 7. Apache / HostGator — pastas sensíveis

Criar `.htaccess` em `editor/.update-tmp/` e `editor/.update-backup/`:

```apache
<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
  Deny from all
</IfModule>
```

---

## 8. Checklist para o modelo gerador de código

Antes de emitir arquivos, conferir:

- [ ] Script novo é `.mjs` ESM com `node:` imports e `ROOT` via `import.meta.url`
- [ ] npm script adicionado na **raiz** `package.json`
- [ ] Apply PHP espelha `removeBundleFiles` + `copyDirExcept(..., auth.config.php)`
- [ ] Não sobrescreve `bio.json`, `assets/` de imagem, `platform-api.json`
- [ ] Front usa `ENDPOINTS.*` + `credentials: 'include'`
- [ ] Plataforma: sem botão (`platformManaged` / `platform-api.json`)
- [ ] Update exige sessão + licença ativa na API
- [ ] Mensagens de erro em português
- [ ] Sem CommonJS (`require(`) nos scripts novos
- [ ] Sem inventar pasta `editor/php/` no **deploy** do cliente — no servidor os PHP ficam em `editor/`

---

## 9. Como anexar no chat externo

Ordem sugerida de anexos:

1. `docs/ATUALIZACOES-REMOTAS.md` (especificação + fases)
2. **Este arquivo** `docs/PADROES-ATUALIZACOES-REMOTAS.md` (padrões + exemplos)
3. `docs/PROMPT-ATUALIZACOES-REMOTAS.md` (prompt da fase)

Frase de abertura:

```text
Você NÃO tem o monorepo. Use PADROES-ATUALIZACOES-REMOTAS.md como fonte de
convenções e exemplos. Espelhe sync-clients-template.mjs na lógica de apply.
Implemente / detalhe só a Fase {A|B|C|D|E}.
```
