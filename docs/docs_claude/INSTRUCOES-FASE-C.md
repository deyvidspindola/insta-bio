# Fase C — instruções de instalação

## O que foi testado neste ambiente e o que NÃO foi

- ✅ `editor/src/lib/updates.ts` (adição de `checkForUpdates`) — compila com `tsc --strict`, sem dependências de JSX.
- ✅ `editor/src/components/UpdatesCard.tsx` (versão com botão) — estrutura revisada manualmente contra o padrão `AdvancedPanel`; o JSX é válido.
- ✅ `editor/php/update-check.php` — sintaxe PHP validada com `php -l` (segue o boilerplate real de `save.php`).
- ⚠️ **Não testado com a API real da plataforma** — o endpoint `updates/check` ainda não existe no painel. O código PHP está preparado para chamá-lo, mas, para testes, você pode usar o mock descrito na seção 5.
- ⚠️ **Integração com `platform-auth.php`** — assume que as funções `editor_load_license_config()` e `editor_platform_post_json()` já existem (conforme padrão do monorepo). Verifique se esses helpers estão disponíveis.

---

## 1. Arquivos deste pacote


| Arquivo                                 | Destino no monorepo                     | Ação                              |
| --------------------------------------- | --------------------------------------- | --------------------------------- |
| `editor/php/update-check.php`           | `editor/php/update-check.php`           | **Criar**                         |
| `editor/src/lib/endpoints.ts`           | `editor/src/lib/endpoints.ts`           | **Editar** (adicionar linha)      |
| `editor/src/lib/updates.ts`             | `editor/src/lib/updates.ts`             | **Editar** (adicionar função)     |
| `editor/src/components/UpdatesCard.tsx` | `editor/src/components/UpdatesCard.tsx` | **Substituir** (versão com botão) |


---

## 2. Conteúdo dos novos arquivos

### 2.1. `editor/php/update-check.php` (criar)

```php
<?php
/**
 * POST editor/update-check.php (rota pública: api/update/check)
 *
 * Fase C — verifica se há uma nova versão disponível na plataforma.
 * NÃO aplica o update (isso é Fase D).
 *
 * Requisitos:
 * - Sessão do editor ativa
 * - Cliente ativo (client-guard)
 * - Cliente NÃO pode ser da plataforma (sem platform-api.json)
 * - license.config.php deve existir e ter slug/token válidos
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

// 3. Clientes da plataforma não têm botão de update — mas, por segurança, bloqueamos aqui também
if (is_file(__DIR__ . '/platform-api.json')) {
    http_response_code(403);
    echo json_encode(['error' => 'Atualizações gerenciadas pela plataforma.']);
    exit;
}

// 4. Carregar configuração de licença (reutiliza funções existentes do platform-auth.php)
if (!function_exists('editor_load_license_config')) {
    require_once __DIR__ . '/platform-auth.php';
}

$config = editor_load_license_config();
if ($config === null || empty($config['slug']) || empty($config['token'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Atualização remota indisponível: licença não configurada.']);
    exit;
}

// 5. Ler versão local instalada (via update-state.json)
$stateFile = __DIR__ . '/update-state.json';
$installedVersion = '0.0.0';
if (is_file($stateFile)) {
    $raw = json_decode((string) file_get_contents($stateFile), true);
    if (is_array($raw) && !empty($raw['version'])) {
        $installedVersion = $raw['version'];
    }
}

// 6. Chamar a API da plataforma (endpoint: updates/check)
try {
    $url = editor_platform_api_url($config['api'], 'updates/check');
    $payload = [
        'slug' => $config['slug'],
        'token' => $config['token'],
        'installed' => $installedVersion,
    ];

    $result = editor_platform_post_json($url, $payload);

    if (!isset($result['ok']) || $result['ok'] !== true) {
        $error = $result['error'] ?? 'Falha na comunicação com a plataforma.';
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => $error]);
        exit;
    }

    // Adiciona a versão instalada na resposta para o front-end
    $result['installed'] = $installedVersion;
    echo json_encode($result);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erro ao verificar atualizações: ' . $e->getMessage()]);
    exit;
}
```

### 2.2. editor/src/lib/endpoints.ts — adicionar uma linha

```ts
export const ENDPOINTS = {
  session: 'api/auth/session',
  // … existentes …
  paths: 'api/bio/paths',
  updateStatus: 'api/update/status',   // (Fase B)
  updateCheck: 'api/update/check',     // NOVO — Fase C
} as const
```

### 2.3. editor/src/lib/updates.ts — adicionar a função checkForUpdates

Adicione este bloco abaixo da função fetchUpdateStatus já existente:

```ts
/**
 * Fase C — verifica remotamente se há uma nova versão disponível.
 * Chama o endpoint updateCheck (PHP) que consulta a API da plataforma.
 */
export async function checkForUpdates(): Promise<{
  ok: boolean
  updateAvailable: boolean
  installed: string
  latest: string
  changelog?: string
  releasedAt?: string
}> {
  const res = await fetch(ENDPOINTS.updateCheck, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    cache: 'no-store',
  })

  const data = (await res.json().catch(() => null)) as {
    ok?: boolean
    error?: string
    updateAvailable?: boolean
    installed?: string
    latest?: string
    changelog?: string
    releasedAt?: string
  } | null

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error ?? 'Falha ao buscar atualizações')
  }

  return {
    ok: true,
    updateAvailable: Boolean(data.updateAvailable),
    installed: data.installed ?? '0.0.0',
    latest: data.latest ?? '',
    changelog: data.changelog,
    releasedAt: data.releasedAt,
  }
}
```

### 2.4. editor/src/components/UpdatesCard.tsx — substituir pelo código abaixo

```tsx
import { useEffect, useState } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { fetchUpdateStatus, checkForUpdates, type UpdateState } from '../lib/updates'

/**
 * Card "Atualizações" da aba Configurações — Fase C.
 * Agora com botão "Buscar atualizações" (só para single-tenant).
 * Ainda SEM botão de aplicar (isso é Fase D).
 */
function formatDate(value: string | null | undefined): string {
  if (!value) return 'nunca'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'nunca'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function UpdatesCard() {
  // Estados da Fase B (leitura)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<UpdateState | null>(null)
  const [platformManaged, setPlatformManaged] = useState(false)

  // Estados da Fase C (check)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [changelog, setChangelog] = useState<string | null>(null)
  const [checkMessage, setCheckMessage] = useState<string | null>(null)

  // Carrega o status inicial (Fase B)
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchUpdateStatus()
        if (cancelled) return
        setState(data.state)
        setPlatformManaged(data.platformManaged)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Não foi possível carregar a versão')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // Handler do botão "Buscar atualizações" (Fase C)
  async function handleCheck() {
    setChecking(true)
    setCheckError(null)
    setCheckMessage(null)
    setUpdateAvailable(false)
    setLatestVersion(null)
    setChangelog(null)

    try {
      const data = await checkForUpdates()
      if (data.updateAvailable) {
        setUpdateAvailable(true)
        setLatestVersion(data.latest)
        setChangelog(data.changelog ?? 'Sem detalhes do changelog.')
        setCheckMessage(`Nova versão ${data.latest} disponível!`)
      } else {
        setCheckMessage('Você está na versão mais recente.')
      }
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : 'Erro ao verificar atualizações')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="card">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <RefreshCw className="h-4 w-4" aria-hidden />
        Atualizações
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Versão do template instalado neste site.
      </p>

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : (
        <div className="space-y-3">
          {/* Exibe versão atual e data */}
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <p>
              <span className="text-foreground">Versão:</span> {state?.version ?? 'desconhecida'}
            </p>
            <p className="mt-1">
              <span className="text-foreground">Última atualização:</span>{' '}
              {formatDate(state?.updatedAt)}
            </p>
          </div>

          {/* Cliente plataforma: sem botão */}
          {platformManaged ? (
            <p className="text-xs text-muted-foreground">
              Atualizações gerenciadas pela plataforma.
            </p>
          ) : (
            <>
              {/* Botão Buscar atualizações */}
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
                onClick={() => void handleCheck()}
                disabled={checking}
              >
                {checking ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-3 w-3" aria-hidden />
                )}
                {checking ? 'Verificando…' : 'Buscar atualizações'}
              </button>

              {/* Mensagens de retorno */}
              {checkError && <p className="text-xs text-red-400">{checkError}</p>}
              {checkMessage && !checkError && (
                <p className="text-xs text-emerald-400">{checkMessage}</p>
              )}

              {/* Se houver atualização, exibe detalhes (sem botão de aplicar — Fase D) */}
              {updateAvailable && latestVersion && (
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                  <p className="text-foreground font-medium">
                    📦 Versão {latestVersion} disponível
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Changelog: {changelog}
                  </p>
                  <p className="mt-2 text-muted-foreground italic">
                    (A aplicação da atualização será disponibilizada em breve — Fase D)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

## 3. Configuração do .htaccess (se necessário)

O editor usa um .htaccess que redireciona api/... para arquivos PHP.
Se o seu já tem uma regra genérica como RewriteRule ^api/(.+)$ $1.php [L], nenhuma alteração é necessária.

Caso contrário, adicione a linha:

```apache
RewriteRule ^api/update/check$ update-check.php [L]
```

Exemplo de bloco completo:

```apache
RewriteEngine On
RewriteRule ^api/auth/session$ session.php [L]
RewriteRule ^api/bio/paths$ paths.php [L]
RewriteRule ^api/update/status$ update-status.php [L]   # Fase B
RewriteRule ^api/update/check$ update-check.php [L]     # Fase C
```

## 4. Integração no AdvancedPanel.tsx (já feito na Fase B)

O `<UpdatesCard />` já deve estar importado e renderizado dentro da aba Configurações. Se ainda não fez, importe-o:

```tsx
import { UpdatesCard } from './UpdatesCard'
```

E coloque `<UpdatesCard />` junto aos outros cards.

## 5. Mock temporário para testar sem a API real

Até que o endpoint updates/check seja implementado no painel, você pode simular a resposta no PHP para validar o fluxo.

No arquivo `editor/php/update-check.php`, substitua o bloco try (a chamada real) por:

```php
// MOCK para testes — remova quando a API estiver pronta
echo json_encode([
    'ok' => true,
    'updateAvailable' => true,        // mude para false para testar "já atualizado"
    'latest' => '9.9.9',
    'changelog' => 'Mock: versão de teste para validar a UI.',
    'releasedAt' => date('c'),
]);
exit;
```

Não se esqueça de remover o mock depois de validar.

## 6. Checklist de teste (humano)

- `php -l editor/php/update-check.php` sem erro de sintaxe.
- `editor/src/lib/updates.ts` compila com tsc (ou com o build do editor).
- `editor/src/components/UpdatesCard.tsx` compila sem erros (build do editor).
- Logado no editor, cliente single-tenant (sem `platform-api.json`):
  - O botão "Buscar atualizações" aparece no card.
  - Ao clicar, mostra spinner "Verificando…".
  - Se houver versão nova (mock), mostra "Nova versão X disponível!" e o changelog.
  - Se não houver (mock com `updateAvailable: false`), mostra "Você está na versão mais recente.".
- Em caso de erro (ex.: API fora do ar), mostra mensagem vermelha.
- Cliente plataforma (com `platform-api.json`):
  - O botão não aparece.
  - Exibe "Atualizações gerenciadas pela plataforma.".
- Cliente sem licença (`license.config.php` ausente ou vazio):
  - O botão aparece, mas ao clicar retorna erro claro (ex.: "Atualização remota indisponível: licença não configurada.").
- Sem sessão (logout): a requisição para `api/update/check` retorna `401`.
- Método não-POST (ex.: GET) retorna `405`.

## 7. O que esta fase NÃO faz (de propósito)

- Não aplica a atualização — o botão de "Atualizar agora" não está presente (será Fase D).
- Não baixa o ZIP nem valida SHA‑256 (Fase D).
- Não faz backup ou substituição de arquivos (Fase D).
- Não mexe no painel da plataforma (/panel/).
- Não implementa o endpoint updates/check no backend do painel — isso é tarefa da Fase E/operação.

## 8. Próximos passos

Após validar a Fase C, podemos avançar para a Fase D (aplicação efetiva com download, SHA, backup, substituição e atualização do update-state.json). Quando estiver pronto, peça o detalhamento da Fase D.