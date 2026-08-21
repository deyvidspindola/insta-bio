# Qualidade de Código — Hooks e painéis duplicados no editor (2026-08-14)

Parte 04 de 05 · [Voltar ao resumo](00-resumo.md)

## Achado #1 — `useBioForms` e `useBioPages` são o mesmo hook de CRUD copiado duas vezes
- **Severidade:** Alto
- **Categoria:** Duplicação
- **Local:** `resources/js/editor/hooks/useBioForms.ts:73-234` e `resources/js/editor/hooks/useBioPages.ts:38-160` (arquivo completo, 236 e 160 linhas respectivamente)
- **Problema encontrado:** os dois hooks implementam, com nomes trocados, exatamente o mesmo fluxo: estado (`list/loading/error/selectedSlug/draft/savedSnapshot/saving/deleting`), `isDirty` calculado com `JSON.stringify`, `load*()` num `useEffect`, `select*()` que popula o draft a partir do item selecionado, `create*()` que faz POST e já seleciona o item criado, `save*()` que faz PUT seguido de um POST em `/publish` (com o mesmo comentário `// Salvar já disponibiliza ... na bio (sem passo "Publicar")` repetido em `useBioForms.ts:180` e `useBioPages.ts:117`), e `delete*()` com o mesmo tratamento de erro. A única diferença real é a forma do "draft" (`EditorDraft` com campos de formulário vs. `BioSection[]`).
- **Por que isso é um problema:** qualquer correção de comportamento no fluxo de CRUD (ex.: tratamento de erro de rede, debounce, retry) precisa ser replicada nos dois arquivos manualmente. Isso já é visível: os dois hooks já divergiram um pouco na forma de aplicar a resposta do servidor (`applyServerForm` em `useBioForms.ts:137-142` vs `applyServerPage` em `useBioPages.ts:96-101` — mesma função, nomes diferentes, sem generalização).
- **Evidência:**
  ```ts
  // useBioForms.ts:171-194
  async function saveDraft(): Promise<BioFormRecord> {
    if (!selectedSlug) throw new Error('Nenhum formulário selecionado')
    setSaving(true)
    ...
    await api<BioFormRecord>(formUrl(selectedSlug), { method: 'PUT', body: JSON.stringify(draftPayload(draft)) })
    const form = await api<BioFormRecord>(publishUrl(selectedSlug), { method: 'POST', body: JSON.stringify({}) })
    applyServerForm(form)
    ...
  }

  // useBioPages.ts:112-131 — mesma estrutura, nomes trocados
  async function saveDraft(): Promise<BioPageRecord> {
    if (!selectedSlug) throw new Error('Nenhuma página selecionada')
    setSaving(true)
    ...
    await api<BioPageRecord>(pageUrl(selectedSlug), { method: 'PUT', body: JSON.stringify({ sections: draftSections }) })
    const page = await api<BioPageRecord>(publishUrl(selectedSlug), { method: 'POST', body: JSON.stringify({}) })
    applyServerPage(page)
    ...
  }
  ```
- **Refatoração sugerida (incremental — não precisa migrar os dois consumidores no mesmo PR):**
  1. Criar `resources/js/editor/hooks/useSlugResourceCrud.ts` com uma função `createResourceCrud<TRecord, TDraft>()` genérica, parametrizada por: `listUrl`, `itemUrl(slug)`, `publishUrl(slug)`, `draftFromRecord(record)`, `draftPayload(draft)`, `emptyDraft`. Ela cobre 100% do que os dois hooks fazem hoje.
  2. Reescrever `useBioPages.ts` como uma casca fina sobre esse hook genérico (mantendo a assinatura pública `UseBioPagesReturn` para não quebrar `PagesPanel.tsx`).
  3. Repetir para `useBioForms.ts` num segundo PR, validando que `FormsPanel.tsx` continua funcionando sem alteração.

## Achado #2 — `PagesPanel` e `FormsPanel` duplicam toda a estrutura de lista/criação/exclusão
- **Severidade:** Alto
- **Categoria:** Duplicação
- **Local:** `resources/js/editor/components/PagesPanel.tsx:44-446` (403 linhas) e `resources/js/editor/components/FormsPanel.tsx:45-449` (405 linhas)
- **Problema encontrado:** além dos hooks (achado #1), os componentes de painel que os consomem também duplicam a UI inteira: estado local idêntico (`creating`, `newTitle`, `creatingBusy`, `confirmDeleteSlug` — `PagesPanel.tsx:75-78` e `FormsPanel.tsx:61-64`), `handleCreate`/`handleSave`/`handleDelete` com a mesma forma (try/catch chamando `onStatus`/`onActionError` com mensagens só trocando o substantivo), o mesmo formulário de criação (input de título + hint "O slug é gerado a partir do título" + botões Criar/Cancelar: `PagesPanel.tsx:337-374` vs `FormsPanel.tsx:348-385`, praticamente linha a linha iguais), e a mesma lista com estado vazio/loading e botões Editar/Remover (`PagesPanel.tsx:393-429` vs `FormsPanel.tsx:400-432`).
- **Por que isso é um problema:** é o mesmo "CRUD de sub-recurso da bio" (achado #1 do arquivo `03-backend-usecases-arquitetura.md` mostra o par equivalente no backend) reimplementado do zero na camada de apresentação. Uma mudança de UX simples — por exemplo, mover o botão "Novo X" para o topo, ou mudar o texto de confirmação de exclusão — precisa ser feita em dois lugares, e nada impede que fiquem visualmente diferentes com o tempo (o que já é sintoma de manutenção cara, não é sobre estética).
- **Evidência:**
  ```tsx
  // PagesPanel.tsx:337-360 (criação)
  {creating && (
    <form className="card space-y-3" onSubmit={(e) => void handleCreate(e)}>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium">Título</span>
        <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Ex.: Catálogo, Sobre, Contato" maxLength={120} disabled={creatingBusy} />
        <span className="block text-[11px] text-muted-foreground">O slug é gerado a partir do título.</span>
      </label>
      ...

  // FormsPanel.tsx:349-363 — mesmo bloco, só placeholder e texto do botão mudam
  ```
- **Refatoração sugerida:**
  1. Extrair um componente compartilhado `ResourceListPanel` (em `resources/js/editor/components/`) que recebe: `title`, `emptyStateIcon`, `items`, `onSelect`, `onDelete`, `createLabel`, `createPlaceholder`, `renderDetail(selectedItem)` — cobrindo lista + criação + exclusão (o "shell" comum), delegando só o conteúdo do detalhe (`SectionEditor`/`FieldGroup` de campos) para quem consome.
  2. Migrar `PagesPanel` primeiro (é o mais simples, delega o detalhe para `SectionEditor` que já existe), validar visualmente, depois migrar `FormsPanel`.
  3. Fazer isso depois do achado #1 (hooks unificados) para não ter que ajustar a mesma UI duas vezes seguidas.

## Achado #3 — `ConfirmDialog` de exclusão duplicado duas vezes dentro do mesmo arquivo
- **Severidade:** Médio
- **Categoria:** Duplicação / Organização
- **Local:** `resources/js/editor/components/PagesPanel.tsx:300-312` e `:431-443` (mesmo `<ConfirmDialog>` renderizado duas vezes no mesmo componente); o mesmo padrão se repete em `resources/js/editor/components/FormsPanel.tsx:312-324` e `:434-446`
- **Problema encontrado:** cada painel tem dois `return` (visão de detalhe e visão de lista) e, em vez de levantar o `<ConfirmDialog>` para fora do `if (selected*)`, cada `return` renderiza sua própria cópia idêntica do diálogo (mesmo `title`, `description`, `confirmLabel`, `onConfirm`, `onCancel`).
- **Por que isso é um problema:** é duplicação local e de baixo risco, mas é o tipo de coisa que diverge sem ninguém perceber — muito fácil editar uma cópia (ex.: mudar o texto de confirmação) e esquecer a outra, já que os dois `return` do componente estão a mais de 100 linhas de distância um do outro.
- **Evidência:**
  ```tsx
  // PagesPanel.tsx:300-312 (dentro do `if (selectedPage)`)
  <ConfirmDialog open={confirmDeleteSlug !== null} title="Excluir página?" ... />

  // PagesPanel.tsx:431-443 (no return da lista, texto idêntico)
  <ConfirmDialog open={confirmDeleteSlug !== null} title="Excluir página?" ... />
  ```
- **Refatoração sugerida:** em cada painel, mover o único `<ConfirmDialog>` para fora do `if (selectedPage) { return ... }`, envolvendo os dois `return` num fragment comum (`return (<>{selectedPage ? <DetailView/> : <ListView/>}<ConfirmDialog .../></>)`), eliminando a cópia. É uma mudança de poucas linhas, sem tocar em lógica.

## Achado #4 — Export morto: `createEmptyConfig` não é usado em lugar nenhum
- **Severidade:** Baixo
- **Categoria:** Organização / Código morto
- **Local:** `resources/js/editor/lib/bio.ts:235-238`
- **Problema encontrado:** a função é marcada `@deprecated Use createDefaultConfig — mantido para compatibilidade`, mas uma busca em todo `resources/js` mostra que ela só aparece na própria definição — nenhum import a usa (`createDefaultConfig`, a substituta, é a única chamada em `resources/js/editor/EditorApp.tsx:62,1082`).
- **Por que isso é um problema:** código "mantido para compatibilidade" sem nenhum consumidor é ruído — aumenta a superfície do arquivo mais carregado do editor (`lib/bio.ts`, 425 linhas) sem necessidade, e o comentário `@deprecated` sugere que já foi avaliado para remoção e ficou esquecido.
- **Evidência:**
  ```
  $ grep -rn "createEmptyConfig" resources/js --include="*.ts" --include="*.tsx"
  resources/js/editor/lib/bio.ts:236:export function createEmptyConfig(): BioConfig {
  ```
- **Refatoração sugerida:** remover `createEmptyConfig` (`bio.ts:235-238`). É uma remoção de 4 linhas sem consumidores — não há risco de quebra (o `tsc`/build vai acusar na hora se alguém dependesse dela).
