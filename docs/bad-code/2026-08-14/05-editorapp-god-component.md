# Qualidade de Código — `EditorApp.tsx` (god component) (2026-08-14)

Parte 05 de 05 · [Voltar ao resumo](00-resumo.md)

## Achado #1 — `EditorApp.tsx` concentra 1185 linhas e 24 `useState` num único componente
- **Severidade:** Crítico
- **Categoria:** Organização/Coesão
- **Local:** `resources/js/editor/EditorApp.tsx:1-1185` (arquivo inteiro); declarações de estado em `:121-148`
- **Problema encontrado:** é de longe o maior arquivo do front-end (o segundo maior, `AppearanceForm.tsx`, tem 764 linhas — 64% do tamanho deste). Concentra, no mesmo componente: autenticação/sessão, histórico de undo/redo, seleção de aba/seção ativa, drag-and-drop de seções, tema claro/escuro, preview (painel lateral e sheet mobile), fluxo de salvar/publicar/reverter/restaurar backup, aviso de atualização de plataforma, e orquestração de `pagesApi`/`formsApi`. Isso é o oposto do padrão que o resto do editor já usa: `useBioPages`/`useBioForms` (ver `04-frontend-duplicacao-e-codigo-morto.md`) isolam estado+lógica de um domínio num hook próprio, e `PagesPanel`/`FormsPanel`/`AppearanceForm` isolam a apresentação. `EditorApp.tsx` é o único lugar onde esse padrão não foi aplicado a si mesmo.
- **Por que isso é um problema:** qualquer mudança pequena (ex.: ajustar o comportamento de undo, ou o texto do aviso de atualização) exige entender um componente com 24 variáveis de estado interdependentes antes de saber se a mudança é segura. É também o arquivo com maior custo de revisão de PR do repositório — e, por ser o "coração" do editor, é onde a falta de teste (achado #1 de `02-testes-automatizados.md`) mais dói.
- **Evidência:**
  ```
  $ wc -l resources/js/editor/EditorApp.tsx
  1185 resources/js/editor/EditorApp.tsx
  $ grep -c "useState" resources/js/editor/EditorApp.tsx
  24
  ```
- **Refatoração sugerida:** ver achados #2 e #3 abaixo para os dois blocos mais isoláveis. Não é uma refatoração de um PR só — a estratégia é extrair um hook por vez (histórico, depois save/publish/revert, depois preview/foco, depois tema/rail), cada extração validável isoladamente porque a interface pública do componente (o que ele renderiza) não muda.

## Achado #2 — Histórico de undo/redo embutido no componente, sem hook próprio
- **Severidade:** Alto
- **Categoria:** Organização/Coesão
- **Local:** `resources/js/editor/EditorApp.tsx:123-124` (estado `past`/`future`), `:112` (`HISTORY_LIMIT`), `:221-230` (`commit`), `:232-238` (`resetConfig`), `:239-245` (`undo`), `:247-253` (`redo`)
- **Problema encontrado:** a lógica de histórico (pilha `past`/`future` limitada a 50 entradas, `commit()` que empilha antes de aplicar mudança, `undo()`/`redo()`) é uma unidade de comportamento autocontida — não depende de nenhum outro estado do componente além do próprio `config`. Hoje ela vive misturada com handlers de UI (`selectRailTab`, `toggleTheme`) no mesmo escopo de função, em vez de isolada como os demais domínios do editor (compare com `useBioPages.ts`/`useBioForms.ts`, que são exatamente esse tipo de extração já feita para outros domínios).
- **Por que isso é um problema:** é lógica pura, sem chamada de API, e por isso é a candidata mais barata para ganhar teste unitário (achado #1 de `02-testes-automatizados.md`) — mas só se for extraída, porque hoje testá-la exige montar o `EditorApp` inteiro.
- **Evidência:**
  ```tsx
  // EditorApp.tsx:221-253
  function commit(updater: BioConfig | ((prev: BioConfig) => BioConfig)) {
    setConfig((prev) => {
      if (!prev) return prev
      const next = typeof updater === 'function' ? updater(prev) : updater
      const synced = { ...next, brand: syncBrandSeo(next.brand) }
      setPast((p) => [...p.slice(-(HISTORY_LIMIT - 1)), prev])
      setFuture([])
      return synced
    })
  }
  ...
  function undo() { ... }
  function redo() { ... }
  ```
- **Refatoração sugerida:**
  1. Criar `resources/js/editor/hooks/useConfigHistory.ts` exportando `useConfigHistory(initial: BioConfig | null)` com `{ config, setConfig, commit, resetConfig, undo, redo, canUndo, canRedo }`, movendo linhas `112`, `122-124`, `221-253` para lá sem alterar comportamento.
  2. Em `EditorApp.tsx`, trocar as declarações de estado e funções pelo retorno do hook (`const { config, commit, undo, redo, ... } = useConfigHistory(...)`).
  3. Escrever teste unitário do hook isolado (undo depois de N commits, limite de `HISTORY_LIMIT`, redo limpo após novo commit).

## Achado #3 — Fluxo de salvar/publicar/reverter/restaurar backup com 4 flags de loading paralelas
- **Severidade:** Médio
- **Categoria:** Organização/Coesão
- **Local:** `resources/js/editor/EditorApp.tsx:142-145` (`saving`, `publishing`, `reverting`, `restoringBackup`), `:437-503` (`handleSave`, `handlePublish`, `handleRevertToPublished`, `handleRestoreBackup`)
- **Problema encontrado:** os quatro handlers seguem o mesmo formato (guarda de concorrência no início, `setX(true)`, `try/catch` chamando `showStatus`/`showActionError`, `finally setX(false)`), cada um com sua própria flag booleana de estado. É o mesmo padrão de "ação assíncrona contra API da bio principal" repetido 4 vezes dentro do componente principal, quando o projeto já tem o padrão de isolar isso em hook (`useBioPages`/`useBioForms`, achado #1 de `04-frontend-duplicacao-e-codigo-morto.md`).
- **Por que isso é um problema:** mistura, no mesmo componente, orquestração de UI (abas, drag, tema) com chamada direta às funções de `resources/js/editor/lib/auth.ts` (`saveBioConfig`, `publishBioConfig`, `revertDraftToPublished`, `restoreBioBackup`) — é lógica de rede dentro do componente "orquestrador", quando o padrão dominante no editor é ter essa borda num hook (`useBioForms`/`useBioPages` já fazem isso para seus domínios).
- **Evidência:**
  ```tsx
  // EditorApp.tsx:437-450
  async function handleSave() {
    if (!config || isDemo || saving || publishing) return
    setSaving(true)
    setActionError(null)
    try {
      await saveBioConfig(config)
      markClean(config)
      showStatus('Rascunho salvo')
    } catch (err) {
      showActionError(err instanceof Error ? err.message : 'Erro ao salvar rascunho')
    } finally {
      setSaving(false)
    }
  }
  // handlePublish (:452-467), handleRevertToPublished (:469-485) e
  // handleRestoreBackup (:487-503) repetem a mesma forma.
  ```
- **Refatoração sugerida:**
  1. Criar `resources/js/editor/hooks/useBioDraftActions.ts` recebendo `config`/`setStatus`/`setActionError` e devolvendo `{ saving, publishing, reverting, restoringBackup, save, publish, revertToPublished, restoreBackup }`, movendo as 4 flags (`:142-145`) e os 4 handlers (`:437-503`) para lá.
  2. Fazer essa extração depois do achado #2 (histórico), reaproveitando `resetConfig` do `useConfigHistory` dentro de `revertToPublished`/`restoreBackup` (hoje chamado diretamente em `:475` e `:493`).
  3. Cada uma das 4 ações pode ganhar teste unitário simples (mock de `saveBioConfig`/etc.) uma vez isolada do resto do componente.
