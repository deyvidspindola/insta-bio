# Fase F — aviso de atualização ao entrar no editor

## Objetivo

Sempre que o usuário **entrar autenticado** no editor (login ou sessão já válida), o app deve:

1. Chamar o **mesmo endpoint** de verificação de versão já usado pelo card de atualizações (`checkForUpdates` → `POST api/update/check`).
2. Se `updateAvailable === true`, abrir um **modal** informando que há uma nova versão.
3. No modal, um botão primário leva o usuário para a aba **Configurações** (`advanced`), onde ele segue o fluxo normal do `UpdatesCard` (Buscar / Atualizar agora).

**Não** aplicar o update automaticamente. **Não** criar endpoint PHP novo.

---

## Contexto do monorepo (já existe)

| Peça | Onde |
|------|------|
| Check remoto | `editor/src/lib/updates.ts` → `checkForUpdates()` |
| Endpoint | `ENDPOINTS.updateCheck` = `api/update/check` |
| Card manual | `editor/src/components/UpdatesCard.tsx` (aba Configurações) |
| Aba Configurações | `EditorApp.tsx` → `activeTab === 'advanced'` |
| Modal reutilizável | `editor/src/components/ConfirmDialog.tsx` |
| Login / sessão | `EditorApp.tsx` — `authenticated` fica `true` após `fetchSession` ou login |

Leia estes arquivos antes de editar. Preserve padrões de UI (classes `btn-primary`, `btn-secondary`, `ConfirmDialog`).

---

## 1. Arquivos a criar / editar


| Arquivo | Ação |
|---------|------|
| `editor/src/components/UpdateAvailableModal.tsx` | **Criar** (ou reutilizar `ConfirmDialog` sem arquivo novo — ver §2) |
| `editor/src/EditorApp.tsx` | **Editar** — check pós-auth + abrir modal + ir para `advanced` |
| `editor/src/lib/updates.ts` | **Opcional** — só se extrair helper de “já avisamos nesta sessão” |

**Não** alterar PHP (`update-check.php`, etc.).

---

## 2. UX e regras (obrigatórias)

1. **Quando rodar o check**
   - Assim que `authenticated === true` e `!isDemo`.
   - Rodar **uma vez por entrada na sessão do editor** (não a cada troca de aba).
   - Em modo demo: **não** chamar.

2. **Falhas silenciosas**
   - Rede / 401 / licença / erro da API: **não** mostrar modal de erro no login.
   - Log opcional em `console.warn`. O usuário ainda pode usar “Buscar atualizações” em Configurações.

3. **Só modal se houver update**
   - `updateAvailable === true` e `latest` preenchido.
   - Mostrar versão instalada vs. versão nova (vindo da resposta de `checkForUpdates`).

4. **Modal**
   - Título: algo como `Nova versão disponível`.
   - Texto: `A versão {latest} está disponível (você está em {installed}). Abra Configurações para atualizar.`
   - Changelog: se vier na resposta, mostrar resumido (máx. ~4–6 linhas ou truncar); se vazio, omitir.
   - Botão primário: `Ir para Configurações` → `setActiveTab('advanced')` + fechar modal.
   - Botão secundário: `Agora não` / `Fechar` → só fecha.
   - Escape / backdrop fecham (mesmo padrão do `ConfirmDialog`).

5. **Não importunar**
   - Se o usuário fechou o modal nesta sessão do browser, **não** reabrir até novo login / reload completo.
   - Sugestão: `sessionStorage` chave `insta-bio:update-prompt-dismissed` com valor = `latest` (se a versão latest mudar, pode avisar de novo).

6. **Não duplicar apply**
   - O modal **não** chama `applyUpdate`. Só navega para Configurações.

---

## 3. Implementação sugerida

### Opção A (preferida) — reutilizar `ConfirmDialog`

Em `EditorApp.tsx`:

```tsx
// estados
const [updatePromptOpen, setUpdatePromptOpen] = useState(false)
const [updatePrompt, setUpdatePrompt] = useState<{
  installed: string
  latest: string
  changelog?: string
} | null>(null)

const UPDATE_PROMPT_KEY = 'insta-bio:update-prompt-dismissed'

useEffect(() => {
  if (isDemo || !authenticated) return

  let cancelled = false

  async function promptIfUpdate() {
    try {
      const data = await checkForUpdates()
      if (cancelled || !data.updateAvailable || !data.latest) return

      const dismissed = sessionStorage.getItem(UPDATE_PROMPT_KEY)
      if (dismissed === data.latest) return

      setUpdatePrompt({
        installed: data.installed,
        latest: data.latest,
        changelog: data.changelog,
      })
      setUpdatePromptOpen(true)
    } catch (err) {
      console.warn('[updates] check no login falhou', err)
    }
  }

  void promptIfUpdate()
  return () => {
    cancelled = true
  }
}, [authenticated, isDemo])

function dismissUpdatePrompt() {
  if (updatePrompt?.latest) {
    sessionStorage.setItem(UPDATE_PROMPT_KEY, updatePrompt.latest)
  }
  setUpdatePromptOpen(false)
}

function goToUpdateSettings() {
  dismissUpdatePrompt()
  setActiveTab('advanced')
}
```

JSX (junto dos outros dialogs do `EditorApp`):

```tsx
<ConfirmDialog
  open={updatePromptOpen && updatePrompt !== null}
  title="Nova versão disponível"
  description={
    <>
      <p>
        A versão <strong>{updatePrompt?.latest}</strong> está disponível
        {updatePrompt?.installed ? (
          <> (você está em {updatePrompt.installed})</>
        ) : null}
        . Abra Configurações para atualizar com segurança.
      </p>
      {updatePrompt?.changelog ? (
        <p className="mt-2 whitespace-pre-wrap text-xs opacity-90">
          {updatePrompt.changelog.length > 280
            ? `${updatePrompt.changelog.slice(0, 280)}…`
            : updatePrompt.changelog}
        </p>
      ) : null}
    </>
  }
  confirmLabel="Ir para Configurações"
  cancelLabel="Agora não"
  variant="default"
  onConfirm={goToUpdateSettings}
  onCancel={dismissUpdatePrompt}
/>
```

Importar:

```ts
import { checkForUpdates } from './lib/updates'
```

### Opção B — componente dedicado

Criar `editor/src/components/UpdateAvailableModal.tsx` encapsulando o mesmo conteúdo, se o `description` do `ConfirmDialog` ficar confuso. Visualmente deve continuar usando as classes do `ConfirmDialog` / `confirm-dialog-*`.

---

## 4. O que NÃO fazer

- Não criar novo endpoint PHP.
- Não chamar `applyUpdate` no modal.
- Não bloquear o editor até o check terminar (check em background; UI normal enquanto isso).
- Não mostrar toast/erro se o check falhar no login.
- Não rodar em `isDemo`.
- Não alterar o fluxo do `UpdatesCard` (continua sendo a fonte do apply).

---

## 5. Critérios de aceite

- [ ] Após login (ou reload com sessão válida), se houver versão mais nova, o modal aparece.
- [ ] Se já estiver na última versão, nenhum modal.
- [ ] “Ir para Configurações” abre a aba `advanced` (onde está o `UpdatesCard`).
- [ ] “Agora não” fecha e não reabre na mesma sessão do browser para a mesma `latest`.
- [ ] Falha de rede no check não atrapalha o uso do editor.
- [ ] Demo mode não faz check.
- [ ] `tsc` / build do editor passam.

---

## 6. Como testar localmente

1. Subir o editor com mock de `api/update/check` retornando `updateAvailable: true` e `latest` > versão instalada (já existe mock no Vite se a Fase C/D estiver ativa — reutilize).
2. Fazer login → modal deve abrir.
3. Clicar “Ir para Configurações” → aba Configurações + card Atualizações visível.
4. Fechar com “Agora não”, trocar de aba e voltar → modal **não** reabre.
5. Reload da página com mesma sessão → se `sessionStorage` ainda tiver a `latest`, não reabre; limpar `sessionStorage` para retestar.
6. Mock com `updateAvailable: false` → sem modal.

---

## 7. Prompt curto (colar no Claude Code / Cursor)

```
Implemente a Fase F do monorepo insta-bio conforme docs/docs_claude/INSTRUCOES-FASE-F.md.

Resumo: após authenticated=true no EditorApp (não demo), chamar checkForUpdates()
(já em editor/src/lib/updates.ts). Se updateAvailable, abrir ConfirmDialog avisando
a nova versão; botão primário setActiveTab('advanced'); dismiss com sessionStorage
por latest. Falhas silenciosas. Não criar PHP novo nem apply no modal.

Siga o padrão visual do ConfirmDialog existente. Critérios de aceite na seção 5 do doc.
```

---

## Notas

- O texto de teste “Teste remoto 1.0.1…” no `UpdatesCard` é legado de QA; **não** é obrigatório mexer nele nesta fase (pode remover se estiver editando o card por outro motivo).
- Clientes plataforma e self-hosted usam o mesmo check (já unificado nas fases anteriores).
