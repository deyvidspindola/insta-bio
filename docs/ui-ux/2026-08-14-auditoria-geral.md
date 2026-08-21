# Relatório de UI/UX — Auditoria geral (2026-08-14)

## Resumo
- Total de pontos encontrados: 11
- Críticos: 1 · Altos: 4 · Médios: 4 · Baixos: 2
- Áreas avaliadas: bio pública (`resources/js/bio`), editor (`resources/js/editor`), app/onboarding (`resources/js/app`), painel admin (`resources/js/admin`)

Observação de escopo: este monorepo não segue a estrutura `bio/`, `editor/src`, `panel/src`, `site/src` — é um projeto Laravel com front-end em `resources/js/{bio,editor,app,admin,site,shared}`. A auditoria foi adaptada para essa estrutura real. Não existem `docs/BIO-JSON.md`/`docs/EDITOR.md` no repo; o modelo de conteúdo foi entendido lendo `docs/roadmap/2026-08-14-formularios-paginas-funil.md` e o código-fonte diretamente.

## Ponto #1 — Tabela de respostas de formulário mostra IDs internos em vez dos rótulos dos campos
- **Severidade:** Crítico
- **Categoria:** Usabilidade
- **Local:** `resources/js/editor/components/FormSubmissionsPanel.tsx:5-11` e `:103-124`; raiz do problema em `resources/js/editor/components/FormsPanel.tsx:32-38` (`newField()`) e `app/UseCases/Forms/GetFormSubmissions.php:56`
- **Problema encontrado:** as respostas de um formulário são gravadas como `Record<fieldId, valor>`, onde `fieldId` é gerado em `newField()` como `campo-${Date.now()}-${random}` (ex.: `campo-1755188273841-x7z2q`). A tabela de respostas (`answerColumns()`) usa exatamente essas chaves como cabeçalho de coluna (`<th>{col}</th>`), sem nunca resolver para `field.label` (o rótulo que o dono digitou, ex. "Nome", "E-mail", "Telefone"). O backend (`GetFormSubmissions.php:56`) também devolve `answers` cru, sem enriquecer com os labels do formulário.
- **Impacto no usuário final:** o dono da bio monta um formulário com campos "Nome", "WhatsApp", "Interesse", mas ao abrir "Respostas" no editor vê colunas com nomes como `campo-1755188273841-x7z2q`, `campo-1755188290002-abc12`. Isso torna a tela de respostas — a entrega principal da feature de Formulários (Fase 3 do roadmap) — praticamente inutilizável sem abrir o editor do formulário em outra aba para tentar adivinhar a ordem dos campos. Mesmo problema no CSV exportado (`downloadCsv`, mesma função `answerColumns`).
- **Evidência:**
  ```ts
  // FormSubmissionsPanel.tsx
  function answerColumns(items: FormSubmissionItem[]): string[] {
    const keys = new Set<string>()
    for (const item of items) {
      Object.keys(item.answers ?? {}).forEach((key) => keys.add(key))
    }
    return Array.from(keys)
  }
  // ...
  {columns.map((col) => (
    <th key={col} className="px-3 py-2.5 font-semibold">{col}</th>
  ))}
  ```
  ```ts
  // FormsPanel.tsx
  function newField(): FormField {
    return {
      id: `campo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'text',
      label: 'Novo campo',
      required: false,
    }
  }
  ```
- **Sugestão de melhoria:** persistir um snapshot dos labels junto com a resposta (ex.: gravar `answers` como `{ [fieldId]: { label, value } }` na Fase 2, ou salvar um `field_labels: Record<fieldId,string>` junto com `form_title` na tabela `form_submissions`) e usar esse snapshot para os cabeçalhos da tabela/CSV. Alternativa mais rápida sem migration: em `GetFormSubmissions.php`, buscar o formulário correspondente (por `form_slug`/`section_id+item_index`) e devolver um mapa `fields: {id, label}[]` junto da lista, e mapear `col` → label no front antes de renderizar `<th>`. Enquanto isso não existe, pelo menos usar `field.label` como parte do `id` (ex. slugify do label) reduziria o dano, mas o correto é resolver via snapshot, pois o label pode mudar depois do envio.

## Ponto #2 — Modal de formulário na bio pública sem foco inicial nem trap de teclado
- **Severidade:** Alto
- **Categoria:** Acessibilidade
- **Local:** `resources/js/bio/components/FormModal.tsx:181-246`
- **Problema encontrado:** `FormModal` (usado quando um card de formulário é `display: 'modal'`, ou quando a ação de um card é `form`) implementa `role="dialog"` + `aria-modal="true"` e fecha com Escape, mas nunca move o foco para dentro do painel ao abrir (nenhum `ref.current.focus()`), e não há trap de `Tab` — o foco pode sair do modal para elementos da bio atrás do overlay enquanto ele está "aberto" visualmente. Ao fechar, o foco também não retorna ao botão/card que abriu o modal.
- **Impacto no usuário final:** visitantes que navegam por teclado ou leitor de tela (inclusive em desktop, não só mobile) abrem o modal e o foco continua onde estava antes (ex. no botão que abriu, que fica coberto pelo backdrop) ou, ao pressionar Tab, pulam para links da bio por trás do modal — uma armadilha de navegação que quebra a experiência para esse público e pode ser reportado como falha de WCAG 2.4.3 (Ordem de foco) e 2.1.2 (sem armadilha, na direção inversa: falta de contenção). Como este é o formulário de captura de lead da bio pública (visto pelo cliente final do dono da bio), o problema afeta diretamente a conversão desse fluxo para usuários de teclado/leitor de tela.
- **Evidência:**
  ```tsx
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { ... }
  }, [open, onClose])
  // nenhum foco inicial, nenhum trap de Tab
  ```
- **Sugestão de melhoria:** ao abrir (`open === true`), fazer `closeButtonRef.current?.focus()` (ou o primeiro campo do formulário) num `useEffect`; guardar o elemento com foco antes de abrir (`document.activeElement`) e devolver o foco a ele em `onClose`; adicionar um handler de `keydown` para `Tab`/`Shift+Tab` que percorra `panelRef.current.querySelectorAll(focusableSelector)` e cicle dentro do painel (o mesmo padrão pode ser extraído para um hook `useFocusTrap` reutilizável, já que `ConfirmDialog.tsx` também só faz foco inicial sem trap completo — ver Nota abaixo).

## Ponto #3 — Topbar do editor sobrecarregada e com navegação duplicada em mobile
- **Severidade:** Alto
- **Categoria:** Responsividade / Consistência visual
- **Local:** `resources/js/editor/EditorApp.tsx:600-736`; CSS em `resources/js/editor/index.css:410-437`
- **Problema encontrado:** o header fixo (`h-14`, ~56px de altura) do editor acumula, em telas < 640px (onde os `<span>` de rótulo ficam `hidden sm:inline`): logo (36px), Desfazer, Refazer, Salvar (pill), Publicar (pill), e mais três botões só-ícone — Respostas (`Inbox`), Funil (`Kanban`), Conta (`CreditCard`) — além de Sair. Esses três (`respostas`, `funil`, `account`) **já existem** como abas na navegação principal (`allRailTabs`, linhas 567-577), que em telas < 1280px vira uma barra rolável horizontal (`editor-rail-nav`, `overflow-x-auto`) com os mesmos destinos rotulados ("Inbox", "Leads", "Plano"). Ou seja, a topbar duplica 3 dos 8+ botões que a barra de navegação de baixo já cobre de forma responsiva, sem necessidade, apertando ainda mais um header que já não tem `flex-wrap` nem `overflow-x-auto` — somando as larguras mínimas dos botões (`topbar-btn` 36px, pills `topbar-draft`/`topbar-publish` com `padding: 0 1.05rem`), o conteúdo à direita facilmente ultrapassa 400-480px, o que não cabe na área útil de um iPhone SE/Mini (largura de conteúdo ~330-350px após `px-3` do header).
- **Impacto no usuário final:** dono de bio usando o editor no celular (o cenário majoritário do produto) pode ter botões da topbar cortados/inacessíveis (o candidato mais provável é "Sair", o último da fila), e mesmo quando cabem, a barra fica visualmente poluída e redundante com a navegação principal logo abaixo — dois lugares diferentes levam ao mesmo "Funil"/"Respostas"/"Conta", o que é inconsistente e desperdiça espaço nobre em tela pequena.
- **Evidência:**
  ```tsx
  {!isDemo && (
    <>
      ...
      <button onClick={() => selectRailTab('respostas')} aria-label="Respostas"><Inbox .../></button>
      <button onClick={() => selectRailTab('funil')} aria-label="Funil"><Kanban .../></button>
      <button onClick={() => selectRailTab('account')} aria-label="Conta"><CreditCard .../></button>
      <button onClick={handleLogout} aria-label="Sair"><LogOut .../></button>
    </>
  )}
  ```
  ```tsx
  // já existem como abas de navegação (EditorApp.tsx:567-577)
  { id: 'respostas', label: 'Respostas', shortLabel: 'Inbox', icon: Inbox },
  { id: 'funil', label: 'Funil', shortLabel: 'Leads', icon: Kanban },
  { id: 'account', label: 'Conta', shortLabel: 'Plano', icon: CreditCard },
  ```
- **Sugestão de melhoria:** remover os botões "Respostas", "Funil" e "Conta" da topbar em telas < `sm`/`md` (ex. `hidden md:inline-flex` neles), já que a `editor-rail-nav` cobre esses destinos com rótulo visível em qualquer largura. Manter na topbar mobile só o essencial: Desfazer/Refazer (ou até mover para dentro do painel de conteúdo), Salvar, Publicar e Sair. Se quiser manter atalhos rápidos no desktop, condicione-os a `xl:` (quando a rail vira sidebar sem esses itens em destaque).

## Ponto #4 — "Salvar" tem significados diferentes dentro do mesmo editor (bio principal vs. Formulários/Páginas)
- **Severidade:** Alto
- **Categoria:** Usabilidade
- **Local:** `resources/js/editor/EditorApp.tsx:654-683` (fluxo Salvar rascunho / Publicar da bio) vs. `resources/js/editor/components/FormsPanel.tsx:45-46,101-108` e `PagesPanel.tsx:44-46,128-135` (comentário: "Salvar já disponibiliza... sem passo 'Publicar'")
- **Problema encontrado:** no editor de conteúdo principal da bio, "Salvar" grava um **rascunho** que não afeta a bio pública até o dono clicar em "Publicar" (confirmado via `ConfirmDialog` com título "Publicar bio?"). Já nos painéis de Formulários e Páginas internas, o mesmo verbo "Salvar" **já publica** o conteúdo imediatamente (é dito explicitamente no docblock do componente: *"Salvar já disponibiliza o formulário na bio — sem passo 'Publicar'"*). Não há nenhuma pista visual na UI desses dois painéis (copy, ícone, aviso) que sinalize essa diferença de comportamento frente ao padrão já aprendido pelo usuário na tela principal do editor.
- **Impacto no usuário final:** o dono da bio aprende, na tela principal, que "Salvar" é seguro/reversível (é só rascunho) e que só "Publicar" — uma ação com `ConfirmDialog` de confirmação — coloca algo no ar. Ao editar um Formulário ou Página interna, esse mesmo aprendizado o leva a esperar que precise publicar depois; na prática, o formulário/página já está live assim que ele clica "Salvar", sem nenhuma confirmação equivalente à de "Publicar bio?". Isso é uma inconsistência de modelo mental que pode levar a publicações acidentais de conteúdo ainda incompleto (ex.: formulário de captura com campos de teste ainda no ar) sem intenção clara do usuário de "publicar".
- **Evidência:**
  ```tsx
  // EditorApp.tsx — bio principal: Salvar = rascunho, Publicar = ao vivo
  title={isDirty ? 'Há alterações não salvas — salvar rascunho (não publica a bio)' : 'Salvar rascunho (não publica a bio)'}
  ...
  <button onClick={() => setConfirmPublishOpen(true)} title="Salvar rascunho e publicar na bio ao vivo">
  ```
  ```tsx
  // FormsPanel.tsx
  /**
   * Lista e edita formulários reutilizáveis (menu Formulários).
   * Salvar já disponibiliza o formulário na bio — sem passo "Publicar".
   */
  ```
- **Sugestão de melhoria:** ou (a) unificar o comportamento — Formulários/Páginas também ganham rascunho + publicar, reaproveitando o mesmo componente de confirmação `ConfirmDialog` com título "Publicar formulário?"/"Publicar página?"; ou (b), se a decisão de produto é manter "salvar = ao vivo" nesses painéis por simplicidade (o que é uma escolha legítima para reduzir passos), tornar isso explícito na UI: trocar o rótulo do botão de "Salvar" para algo como "Salvar e publicar" nesses dois painéis, ou adicionar um texto fixo abaixo do botão ("Alterações ficam visíveis na bio assim que você salva aqui.") para não colidir silenciosamente com o padrão aprendido na tela principal.

## Ponto #5 — Exclusão de lead usa `window.confirm()` nativo em vez do padrão de confirmação do editor
- **Severidade:** Alto
- **Categoria:** Consistência visual / Usabilidade
- **Local:** `resources/js/editor/components/LeadsPanel.tsx:154-156`
- **Problema encontrado:** o editor tem um componente `ConfirmDialog` dedicado, estilizado, acessível (foco inicial, Escape, `role="alertdialog"`) e é usado consistentemente para toda ação destrutiva em `PagesPanel`, `FormsPanel`, `SectionEditor`, `ImagesGallery`, `AdvancedPanel` e `AppearanceForm`. `LeadsPanel.tsx` é o único lugar do editor que usa o `window.confirm()` nativo do navegador para excluir um lead.
- **Impacto no usuário final:** ao excluir um lead no Funil, o dono da bio vê uma caixa de diálogo do sistema operacional/navegador — sem a marca, sem o mesmo texto/tom das outras confirmações, com botões "OK/Cancelar" em vez de "Remover/Cancelar", e que bloqueia a thread JS (nenhuma animação, foco tratado de forma diferente pelo navegador). É uma quebra perceptível de consistência dentro da mesma sessão de uso, bem na ação mais destrutiva do painel (excluir um lead apagado não tem undo).
- **Evidência:**
  ```tsx
  onRemove={() => {
    if (window.confirm('Excluir este lead?')) void remove(lead.id)
  }}
  ```
- **Sugestão de melhoria:** trocar por `ConfirmDialog` no mesmo padrão dos demais painéis: `const [confirmDeleteId, setConfirmDeleteId] = useState<number|null>(null)`, abrir ao clicar "Excluir", e renderizar `<ConfirmDialog open=... variant="danger" title="Excluir lead?" description="Esta ação não pode ser desfeita." onConfirm={...} onCancel={...} />` — reaproveitando exatamente o texto/tom já usado em `FormsPanel`/`PagesPanel` ("Esta ação não pode ser desfeita").

## Ponto #6 — Indicador de foco dos campos de formulário na bio pública depende só de mudança sutil de borda
- **Severidade:** Médio
- **Categoria:** Acessibilidade
- **Local:** `resources/js/bio/index.css:798-811` (`.bio-form-input`, `.bio-form-input:focus`)
- **Problema encontrado:** os inputs/textarea do bloco de Formulário (`bio-form-input`) desativam o outline padrão do navegador (`outline: none;`) e, ao ganhar foco, só mudam a cor da borda de 1px para `color-mix(in oklch, var(--color-primary) 55%, transparent)` — sem `box-shadow`, sem espessura maior, sem `outline`. Todos os outros elementos interativos customizados da bio pública (`bio-slide-nav`, `bio-product-thumb`, `bio-lightbox-nav`, `bio-video-mute-btn`) definem `:focus-visible` com outline de 2px bem visível; os inputs de formulário são a exceção.
- **Impacto no usuário final:** visitante navegando por teclado (ou com baixa visão) em um tema de bio com paleta de cor `primary` próxima da cor de fundo/borda (comum em temas customizados, já que a cor primária é escolhida livremente pelo dono da bio) pode não perceber com clareza qual campo do formulário está focado — a única pista é uma borda de 1px que pode ter baixo contraste dependendo da combinação de cores escolhida. Isso é um requisito de acessibilidade (WCAG 2.4.7) especialmente relevante aqui porque a cor de foco é *derivada de uma cor de marca configurável pelo usuário*, não uma cor fixa testada.
- **Evidência:**
  ```css
  .bio-form-input {
    ...
    outline: none;
  }
  .bio-form-input:focus {
    border-color: color-mix(in oklch, var(--color-primary) 55%, transparent);
  }
  ```
- **Sugestão de melhoria:** trocar `:focus` por `:focus-visible` e reforçar o indicador com um segundo sinal independente da paleta, por exemplo `box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 35%, transparent)` somado à borda — ou, mais simples e robusto, não remover o `outline` e sim customizar `outline: 2px solid var(--color-primary); outline-offset: 1px;` no `:focus-visible`, seguindo o mesmo padrão já usado em `.bio-lightbox-nav:focus-visible`.

## Ponto #7 — Cor de erro do formulário usa `dark:` do Tailwind (tema do SO) em vez do sistema de tema da própria bio
- **Severidade:** Médio
- **Categoria:** Consistência visual
- **Local:** `resources/js/bio/components/FormModal.tsx:169`
- **Problema encontrado:** toda a bio pública resolve claro/escuro via `data-bio-surface="light"|"dark"` no elemento raiz (`BioPage.tsx:121`) e variáveis CSS (`--color-foreground`, `--color-muted-foreground` etc.) — é assim que cada template/tema escolhido pelo dono da bio se aplica corretamente. A única exceção no diretório `bio/` é a mensagem de erro do formulário, que usa as classes `text-amber-600 dark:text-amber-400` do Tailwind, cujo variante `dark:` responde ao `prefers-color-scheme` do sistema operacional do visitante — que é *independente* do tema/superfície escolhido pelo dono da bio.
- **Impacto no usuário final:** um visitante com o celular em modo escuro (comum) que acessa uma bio configurada com template claro (`data-bio-surface="light"`) vê a mensagem de erro do formulário ("Preencha o campo... / Não foi possível enviar...") na variante `amber-400` pensada para fundo escuro, sobre um card de fundo claro — combinação de cor não testada/prevista pelo restante do sistema de temas, com risco real de baixo contraste ou aparência destoante do resto da bio. É o único ponto de toda a bio pública que não seenue o mecanismo de tema oficial do produto.
- **Evidência:**
  ```tsx
  {error && <p className="text-[11px] text-amber-600 dark:text-amber-400">{error}</p>}
  ```
- **Sugestão de melhoria:** trocar por uma cor derivada das variáveis do tema da bio, ex. `style={{ color: 'oklch(0.62 0.19 55)' }}` fixo (não depender de light/dark do SO), ou melhor, usar `color-mix(in oklch, var(--color-foreground) 85%, oklch(0.65 0.2 40))` para garantir contraste com o `--color-card`/`--color-background` efetivos daquela bio, do mesmo jeito que o resto do arquivo resolve cor via `contrastTextOn`/`resolvePrimarySurfaceColors` em `colorEngine.ts`.

## Ponto #8 — Painel admin: alternância de plano/status sem confirmação nem feedback de carregamento
- **Severidade:** Médio
- **Categoria:** Usabilidade
- **Local:** `resources/js/admin/components/BioTable.tsx:37-49`
- **Problema encontrado:** os botões que trocam o plano (`free`/`pro`) e o status (`active`/`suspended`) de uma bio são texto puro clicável (`<button onClick={...}>{bio.plan}</button>`, sem classe de estilo de botão), sem `disabled` durante o `onPatch` em andamento, sem confirmação e sem indicação visual de "pendente". Suspender uma bio é uma ação com efeito direto e imediato na experiência do cliente final (a bio publicada some/mostra estado suspenso).
- **Impacto no usuário final:** o operador do painel admin pode clicar duas vezes sem perceber (não há feedback de "salvando"), ou clicar sem querer em "active" pensando que é só um rótulo de status (não há affordance visual de botão) e suspender a bio de um cliente pagante sem nenhuma etapa de confirmação — ação de alto impacto para o cliente final, tratada com a mesma leveza de um toggle trivial.
- **Evidência:**
  ```tsx
  <button type="button" onClick={() => void onPatch(bio.id, { status: bio.status === 'active' ? 'suspended' : 'active' })}>
    {bio.status}
  </button>
  ```
- **Sugestão de melhoria:** dar affordance visual de botão (badge/pill com cor por status, ex. verde para `active`, vermelho para `suspended`) e, para a transição `active → suspended`, usar confirmação (mesmo que um `window.confirm` simples já seria melhor que nada aqui, mas o ideal é seguir o padrão de `ConfirmDialog` do editor, já que o admin importa de `shared/ui`). Adicionar estado local de "atualizando" por linha (`disabled` + spinner) para evitar duplo clique.

## Ponto #9 — Título do card de grade sem limite de linhas pode ficar cortado de forma abrupta
- **Severidade:** Médio
- **Categoria:** Vulnerabilidade de layout
- **Local:** `resources/js/bio/components/GridCard.tsx:50-59`
- **Problema encontrado:** o título do `GridCard` (card quadrado com imagem/gradiente de fundo) é renderizado sem `line-clamp` dentro de uma área absolutamente posicionada (`absolute inset-x-0 bottom-0 p-3`) sobre um card com `aspect-square` e `overflow: hidden` (herdado de `.bio-card`). Não há limite de caracteres reforçado no editor para esse campo (`GridItemFields.tsx` usa `input` de texto livre sem `maxLength`, a checar, mas mesmo com limite curto, títulos com quebras de palavra longas — ex. link de e-commerce, nome de produto extenso — podem ocupar 3-4 linhas).
- **Impacto no usuário final:** dono da bio que cola um título mais longo num card de grade (2 colunas, pouco espaço) vê o texto ser cortado de forma abrupta pelo `overflow: hidden` do card (sem reticências, sem gradiente de leitura), com risco de cortar no meio de uma palavra ou sobrepor visualmente o `subtitle` logo abaixo — para os cards de grade especificamente (mais estreitos que os cards de lista), o espaço é o mais apertado de toda a bio.
- **Evidência:**
  ```tsx
  <div className="absolute inset-x-0 bottom-0 p-3">
    <h3 className="text-base font-bold leading-tight" style={{ color: titleColor }}>
      {item.title}
    </h3>
    ...
  </div>
  ```
- **Sugestão de melhoria:** aplicar `line-clamp-2` (Tailwind) no `h3` do `GridCard` (e conferir o mesmo em `FeatureCard`/`PressCard` se tiverem o mesmo padrão de overlay), garantindo reticências previsíveis em vez de corte abrupto pelo `overflow:hidden` do card pai.

## Ponto #10 — Botões da topbar do editor abaixo da área de toque mínima recomendada
- **Severidade:** Baixo
- **Categoria:** Acessibilidade / Responsividade
- **Local:** `resources/js/editor/index.css:410-422` (`.topbar-btn`, `height: 2.25rem` = 36px)
- **Problema encontrado:** os botões ícone-apenas da topbar (Desfazer, Refazer, Respostas, Funil, Conta, Sair) têm 36×36px efetivos. O padrão amplamente adotado (Apple HIG e Material Design) recomenda ao menos 44×44px (ou 48dp) para alvos de toque tocados com frequência; o WCAG 2.5.5 (AAA) pede o mesmo, e o AA (2.5.8, mínimo 24px) já é atendido, mas com folga pequena.
- **Impacto no usuário final:** em uso com uma mão no celular (cenário típico de um produto de bio-link), botões de 36px lado a lado (com gap de só 4px em mobile) aumentam a chance de toque no botão vizinho — especialmente relevante porque, com o Ponto #3, esses botões ficam ainda mais espremidos.
- **Evidência:**
  ```css
  .topbar-btn {
    height: 2.25rem; /* 36px */
    padding: 0 0.6rem;
  }
  ```
- **Sugestão de melhoria:** aumentar para `h-11` (2.75rem/44px) pelo menos em `max-width: 640px` (mesmo padrão já usado em outros botões do próprio editor, ex. `min-h-10`/`min-h-11` em `FormsPanel.tsx`/`SectionSidebar.tsx`), ou aumentar a área de toque via `padding` sem mudar o tamanho visual do ícone.

## Ponto #11 — `ConfirmDialog` (editor) trava o foco inicial mas não implementa trap completo de Tab
- **Severidade:** Baixo
- **Categoria:** Acessibilidade
- **Local:** `resources/js/editor/components/ConfirmDialog.tsx:29-46`
- **Problema encontrado:** diferente do `FormModal` da bio pública (Ponto #2), o `ConfirmDialog` do editor já foca o botão "Cancelar" ao abrir (`cancelRef.current?.focus()`) e trata Escape — está mais avançado. Mas ainda falta o trap de `Tab`: como o diálogo só tem dois botões, o risco prático é baixo (o navegador tende a manter o foco nos elementos visíveis mais próximos), mas tecnicamente `Tab`/`Shift+Tab` repetidos podem sair do diálogo para elementos do painel atrás dele, já que não há `inert`/trap no restante da árvore.
- **Impacto no usuário final:** menor que o Ponto #2 (painel interno, usuário já autenticado, diálogo simples de 2 botões), mas ainda pode confundir um usuário de teclado que tecla Tab repetidamente esperando ciclar entre "Cancelar"/"Confirmar" e acaba interagindo com o formulário por trás do overlay.
- **Evidência:** ver bloco de código do Ponto #2/EditorApp — mesmo padrão, sem `keydown` para `Tab`.
- **Sugestão de melhoria:** como há dois componentes de modal com o mesmo gap (`FormModal.tsx` na bio e `ConfirmDialog.tsx` no editor), vale extrair um hook único `useFocusTrap(panelRef, open)` em `resources/js/shared/` e aplicar nos dois, resolvendo os Pontos #2 e #11 de uma vez com uma única implementação testada.

## Notas / Itens avaliados e descartados
- **Reordenação por arraste (drag-and-drop) de seções e cards no editor** (`SectionSidebar.tsx`, `SectionEditor.tsx`): usa `draggable` nativo (não funciona em touch), mas isso já está corretamente tratado — a UI de arraste fica `hidden ... sm:inline`/dentro de `hidden md:block`, e existe alternativa 100% funcional por toque em todos os casos: botões de seta cima/baixo sempre visíveis, mais um `SectionOrderSheet` dedicado para mobile. Não é um problema.
- **Alt text em imagens da bio pública**: verificado em todos os componentes de card (`FeatureCard`, `GridCard`, `ProductsCard`, `SlideCard`, `PressCard`, `ImageLightbox`, `CardCoverImage`, `BioHeader`) — todos preenchem `alt` com o título do item ou `alt=""` proposital para imagens puramente decorativas (capa do header). Bem resolvido.
- **Estados de loading/vazio/erro nos painéis novos** (`FormsPanel`, `PagesPanel`, `FormSubmissionsPanel`, `LeadsPanel`): todos têm estado de carregamento (`Loader2` girando ou texto "Carregando…"), estado vazio com ícone + texto explicativo, e mensagens de erro via `ErrorText`/`onActionError`. Consistente e bem implementado — só a exceção pontual do `window.confirm` (Ponto #5).
- **Navegação principal do editor em mobile (`editor-rail-nav`)**: vira corretamente uma barra rolável horizontal com rótulos curtos visíveis (`overflow-x-auto`, `rail-btn-label`) abaixo de 1280px — solução responsiva sólida, meramente duplicada pela topbar (Ponto #3), não com problema nela mesma.
