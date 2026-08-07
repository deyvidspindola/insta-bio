# Relatório de UI/UX — Auditoria geral (2026-07-30)

## Resumo
- Total de pontos encontrados: 6
- Críticos: 0 · Altos: 2 · Médios: 3 · Baixos: 1
- Áreas avaliadas: bio (prioridade) / editor / panel / site

Metodologia: leitura integral dos componentes React/TSX e das classes Tailwind aplicadas em `bio/src`, `editor/src`, `panel/src` e `site/src`, cruzando com `docs/BIO-JSON.md`, `docs/EDITOR.md` e `docs/APARENCIA-EDITOR.md`. Cada ponto abaixo foi confirmado no código-fonte (não apenas por nome de arquivo/grep) e verificado quanto a tratamentos já existentes (line-clamp, truncate, aria, breakpoints) antes de ser reportado.

---

## Ponto #1 — Título/nome sem quebra de palavra pode romper o layout da bio pública
- **Severidade:** Alto
- **Categoria:** Vulnerabilidade de layout
- **Local:** `bio/src/components/BioHeader.tsx:64` (nome) e `:67` (tagline); padrão repetido em `bio/src/components/LinkCard.tsx:28-30,50-52`, `bio/src/components/FeatureCard.tsx:69-71,122,174-176`, `bio/src/components/GridCard.tsx:51`
- **Problema encontrado:** O `<h1>{brand.name}</h1>` que exibe o nome da marca no topo da bio pública (o primeiro elemento visto por qualquer visitante) não tem `break-words`/`overflow-wrap`. Confirmei via grep em todo `bio/src/components/*.tsx` que apenas 2 componentes usam `break-words` (`ListCard.tsx:87` e `TextBlock.tsx:46`); todos os demais títulos (`h1` da marca, `h3` de `LinkCard`, `FeatureCard`, `GridCard`, `AppHeroCard`, `PressCard`) não têm. Como o container é `max-w-md`/`max-w-xs` mas o CSS não força quebra dentro de palavra, uma única palavra longa sem espaços (comum em nomes de marca colados sem espaço, @handles usados como nome, ou textos com muitos caracteres especiais) não quebra de linha — ela estoura a largura do container.
- **Impacto no usuário final:** Visitante da bio pública em qualquer dispositivo, mas o efeito é mais grave em mobile (viewport estreita): o nome pode vazar horizontalmente e, como não há `overflow-x: hidden` global em `html`/`body` (`bio/src/index.css`), isso pode gerar scroll horizontal na página inteira — quebrando a primeira impressão da bio de um cliente real.
- **Evidência:**
  ```tsx
  // bio/src/components/BioHeader.tsx:64
  <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">{brand.name}</h1>
  ```
  Comparado ao único padrão correto do projeto:
  ```tsx
  // bio/src/components/TextBlock.tsx:46
  className="whitespace-pre-wrap break-words text-sm leading-relaxed"
  ```
- **Sugestão de melhoria:** Adicionar `break-words` (ou `[overflow-wrap:anywhere]` para cobrir também strings sem espaços nem hífens) no `h1` de `BioHeader.tsx:64` e na tagline (`:67`). Estender o mesmo ajuste aos `h3` de título nos cards (`LinkCard`, `FeatureCard`, `GridCard`, `AppHeroCard`, `PressCard`), já que todos compartilham o mesmo risco.

---

## Ponto #2 — Seção fica com título "órfão" quando todos os cards saem da janela de agendamento
- **Severidade:** Alto
- **Categoria:** Vulnerabilidade de layout
- **Local:** `bio/src/components/BioSection.tsx:304-344` (função `BioSectionBlock`)
- **Problema encontrado:** `BioSectionBlock` calcula `items = filterVisibleItems(section.items)` (linha 316) para esconder cards fora da janela de `schedule`, mas renderiza o `<SectionTitle>` (linhas 325-331) e o container de itens (grid ou stack, linhas 332-393) **incondicionalmente**, sem checar se `items.length === 0`. Isso é 100% alcançável em produção sem nenhum erro do cliente: basta uma seção ter só um card com `schedule.until` no passado (ex.: "Campanha de Páscoa" do próprio exemplo em `docs/BIO-JSON.md`) para a seção inteira virar um título + subtítulo flutuando sobre um espaço vazio, sem nenhum card abaixo.
- **Impacto no usuário final:** Visitante da bio pública vê um título de seção (ex. "Eventos") seguido de um vazio, sem explicação — parece bug/carregamento quebrado. Acontece automaticamente com o tempo (campanha expira), sem qualquer ação do cliente que administra a bio.
- **Evidência:**
  ```tsx
  // bio/src/components/BioSection.tsx:314-331
  const isGrid = section.layout === 'grid-2'
  const items = isPreviewMode() ? section.items : filterVisibleItems(section.items)
  ...
  return (
    <section>
      {!section.hideTitle && (
        <SectionTitle title={section.title} subtitle={section.subtitle} pageBackground={pageBackground} />
      )}
      {isGrid ? ( <div className="mb-3 grid grid-cols-2 ...">{items.map(...)}</div> ) : ( ... )}
    </section>
  )
  ```
- **Sugestão de melhoria:** Logo após calcular `items` (linha 316), adicionar `if (items.length === 0) return null` no início de `BioSectionBlock`, para que a seção inteira (título incluso) só apareça quando houver ao menos um card visível.

---

## Ponto #3 — Card de lista pode ficar totalmente vazio e ainda assim ser renderizado
- **Severidade:** Médio
- **Categoria:** Vulnerabilidade de layout
- **Local:** `bio/src/components/ListCard.tsx:41,60-93`; reprodutível via `editor/src/components/item-editors/ListItemFields.tsx:82-96` (botão "Remover item" sem mínimo de 1 item)
- **Problema encontrado:** `ListCard` filtra strings em branco (`item.items.filter((entry) => entry.trim())`, linha 41), mas segue renderizando o `<div className={shellClass}>` com fundo (`bio-card px-4 py-4`) e `<ul>` mesmo quando `items.length === 0`. No editor, `ListItemFields.tsx` permite remover itens um a um até zero, sem nenhum guard de mínimo — ou seja, o cliente consegue publicar uma bio com um card de lista vazio (com ou sem título) sem nenhum aviso.
- **Impacto no usuário final:** Visitante da bio pública vê uma caixa arredondada com fundo (às vezes cor customizada) e, na melhor das hipóteses, só um título, sem nenhum conteúdo — um "buraco" visual na página. Cliente no editor não recebe nenhum aviso de que o card ficou vazio antes de salvar/publicar.
- **Evidência:**
  ```tsx
  // bio/src/components/ListCard.tsx:41
  const items = item.items.filter((entry) => entry.trim())
  // ... (linhas 60-93: div/h3/ul sempre renderizados, sem checar items.length)
  ```
  ```tsx
  // editor/src/components/item-editors/ListItemFields.tsx:99-106
  <button ... onClick={() => onChange({ ...item, items: [...item.items, ''] })}>
    Adicionar item
  </button>
  // não há bloqueio para remover o último item restante
  ```
- **Sugestão de melhoria:** Em `ListCard.tsx`, logo após a linha 41, adicionar `if (items.length === 0) return null`. Complementarmente, em `ListItemFields.tsx`, desabilitar o botão "Remover" (linha 82-96) quando `item.items.length === 1`, ou exibir um aviso inline ("Adicione ao menos um item para o card aparecer na bio").

---

## Ponto #4 — Título de card com imagem é cortado sem reticências em textos longos
- **Severidade:** Médio
- **Categoria:** Vulnerabilidade de layout / Consistência visual
- **Local:** `bio/src/components/FeatureCard.tsx:68-77` (variante `square`), `:116-124` (`portrait`), `:166-178` (`banner`); mesmo padrão em `bio/src/components/GridCard.tsx:50-59`
- **Problema encontrado:** Nessas variantes, o título (`<h3>`) fica dentro de uma camada `absolute inset-x-0 bottom-0` sobre a imagem, dentro de um contêiner com `overflow: hidden` (classe global `.bio-card` em `bio/src/index.css:119-121`, e adicionalmente `overflow-hidden` inline nas variantes `portrait`/`banner`). Nenhum desses `h3` usa `line-clamp`. Um título longo (sem limite de caracteres imposto no editor — ver evidência abaixo) cresce verticalmente e é cortado de forma abrupta pelo `overflow: hidden`, sem reticências, no meio de uma palavra ou frase. Isso contrasta com o mesmo tipo de card em `AppHeroCard.tsx` (`HeroCompact`, linha 257, e `HeroCondensed`, linha 312) e `PressCard.tsx` (linhas 183 e 237), que já usam `line-clamp-2` corretamente.
- **Impacto no usuário final:** Visitante da bio pública em cards de eventos/grade (2 colunas, uso comum documentado em `docs/BIO-JSON.md`) vê texto cortado no meio, parecendo erro de carregamento. Cliente no editor não recebe nenhum aviso sobre o limite prático de caracteres para essas variantes.
- **Evidência:**
  ```tsx
  // bio/src/components/FeatureCard.tsx:68-71 (variante square)
  <div className="absolute inset-x-0 bottom-0 p-3">
    <h3 className="text-base font-bold leading-tight" style={{ color: titleColor }}>
      {item.title}
    </h3>
  ```
  ```tsx
  // editor/src/components/item-editors/FeatureItemFields.tsx:92-97
  <Field label="Título">
    <input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
  </Field>
  // sem maxLength nem contador, diferente de TextItemFields.tsx (maxLength=300 + contador)
  ```
- **Sugestão de melhoria:** Adicionar `line-clamp-2` (variantes `square`/`compact`) ou `line-clamp-3` (`portrait`/`banner`, que têm mais altura) ao `h3` nas três variantes citadas de `FeatureCard.tsx` e em `GridCard.tsx:51`. No editor, adicionar `maxLength={70}` e um contador de caracteres no campo "Título" de `FeatureItemFields.tsx` (mesmo padrão já usado em `TextItemFields.tsx:97-105`).

---

## Ponto #5 — Modais do painel sem trap de foco, sem fechar com Esc e sem semântica de diálogo
- **Severidade:** Médio
- **Categoria:** Acessibilidade
- **Local:** `panel/src/components/EditClientModal.tsx` (todo o componente), `panel/src/components/CreateClientModal.tsx`, `panel/src/components/PasswordModal.tsx`, `panel/src/components/CredentialsModal.tsx`
- **Problema encontrado:** Busquei por `role=`, `aria-modal`, tratamento de tecla `Escape` e gerenciamento de foco (`useRef`/`autoFocus`/`.focus()`) nos quatro modais do painel e não há nenhuma ocorrência. Os modais são um `div.modal-root` com um botão de backdrop e `div.modal-panel` sem `role="dialog"`/`aria-modal="true"`, sem fechar com Esc e sem mover o foco para dentro do modal ao abrir. Isso contrasta diretamente com `editor/src/components/ConfirmDialog.tsx:29-46,60-66`, que no mesmo monorepo já implementa foco no botão cancelar ao abrir, fechamento por Esc, e `role="alertdialog"` + `aria-modal` + `aria-labelledby`/`aria-describedby` corretamente.
- **Impacto no usuário final:** Admin da plataforma navegando por teclado ou leitor de tela no painel (`panel/`) não consegue fechar o modal com Esc, o foco permanece onde estava antes de abrir (ex. no botão que abriu o modal, atrás do overlay) e leitores de tela não anunciam a abertura de um diálogo modal — o conteúdo por trás continua navegável via Tab, quebrando a expectativa de um modal.
- **Evidência:**
  ```
  $ grep -n "role=\|aria-modal\|Escape\|useRef\|autoFocus\|focus()" panel/src/components/CreateClientModal.tsx panel/src/components/PasswordModal.tsx panel/src/components/CredentialsModal.tsx
  (nenhuma ocorrência)
  ```
  ```tsx
  // panel/src/components/EditClientModal.tsx:69-71
  <div className="modal-root">
    <button type="button" className="modal-backdrop" aria-label="Fechar" onClick={onClose} />
    <div className="modal-panel">
  ```
- **Sugestão de melhoria:** Extrair um wrapper `Modal` compartilhado no painel (ou reaproveitar a lógica de `editor/src/components/ConfirmDialog.tsx:29-46`) que: adicione `role="dialog"` `aria-modal="true"` `aria-labelledby` ao `div.modal-panel`; registre um `useEffect` com `document.addEventListener('keydown', ...)` fechando no `Escape`; e foque o primeiro campo ou botão do modal ao montar. Aplicar nos quatro modais citados.

---

## Ponto #6 — Exclusão de cliente usa `window.confirm()` nativo, inconsistente com o padrão do editor
- **Severidade:** Baixo
- **Categoria:** Consistência visual
- **Local:** `panel/src/App.tsx:100-107` (`handleDelete`), comparado a `editor/src/EditorApp.tsx:883-901` (`ConfirmDialog` para publicar)
- **Problema encontrado:** A exclusão de um cliente (ação irreversível, remove a pasta `/slug/` do servidor) usa `window.confirm(...)` — o diálogo nativo do navegador, sem estilo, sem marca, bloqueante de thread — enquanto o editor, no mesmo monorepo, já tem um componente `ConfirmDialog` estilizado e acessível reservado exatamente para esse tipo de confirmação.
- **Impacto no usuário final:** Admin da plataforma vê uma experiência visualmente destoante (popup do navegador) numa ação crítica (exclusão permanente de cliente), diferente do restante da interface do painel/editor. Não bloqueia o uso, mas quebra a consistência de marca e, em alguns navegadores/contextos embutidos, `window.confirm` pode ser suprimido ou exibido de forma inconsistente.
- **Evidência:**
  ```tsx
  // panel/src/App.tsx:100-107
  async function handleDelete(client: Client) {
    if (!window.confirm(`Excluir "${client.name}"? A pasta /${client.slug}/ será removida permanentemente.`)) {
      return
    }
  ```
- **Sugestão de melhoria:** Substituir o `window.confirm` por um componente de confirmação estilizado equivalente ao `ConfirmDialog` do editor (pode ser o mesmo componente, movido para um pacote compartilhado), usando `variant="danger"` e reaproveitando a mensagem já escrita.

---

## Notas / Itens avaliados e descartados
- **`editor/src/components/SectionEditor.tsx:395-429`** — Exclusão de seção e de card já usa `ConfirmDialog` customizado, com foco, Esc e ARIA corretos. Nenhum problema encontrado aqui (serviu de referência positiva para os Pontos #5 e #6).
- **`editor/src/components/item-editors/TextItemFields.tsx:96-105`** — Campo de texto livre já implementa `maxLength={300}` e contador de caracteres visível, condizente com o limite documentado em `docs/BIO-JSON.md`.
- **`editor/src/components/TemplateCard.tsx`** — `truncate`/`line-clamp` aplicados corretamente em todos os textos dinâmicos (nome, tagline, descrição, badges), sem os problemas de overflow encontrados no Ponto #4.
- **`panel/src/components/ClientTable.tsx:22-23`** — Tabela larga tratada corretamente com `overflow-x-auto` + `min-w-[720px]` no wrapper; não quebra o layout em telas estreitas, apenas cria scroll horizontal controlado (padrão aceitável para tabela de admin).
- **`bio/src/components/icons.tsx:264-280`** (`BioIcon`) — Fallback seguro para nomes de ícone desconhecidos ou ausentes no `bio.json` (retorna `null`), sem risco de crash da página pública com conteúdo malformado.
- **`bio/src/lib/contrastColor.ts`, `bio/src/lib/colorEngine.ts`** — Motor de contraste dinâmico já ajusta cor de texto sobre fundos customizados (imagem, gradiente, cor sólida); não identifiquei problema de legibilidade a reportar.
- **`bio/src/components/CardCoverImage.tsx`** — Imagens sempre renderizadas dentro de contêineres com `aspect-*`/`aspect-square` fixo; não há layout shift por imagem sem dimensão reservada.
