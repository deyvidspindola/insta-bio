# Documento técnico — Editor visual de componentes

## 1. Entendimento

O editor da bio hoje é **form-driven**: a aba "Conteúdo" usa `SectionSidebar` + `SectionEditor` (acordeão) + `ItemEditor`, e o preview é só um iframe lateral que reflete o estado via `postMessage`. A demanda é migrar a edição de **conteúdo/seções** para um editor **canvas-centrado**: paleta de componentes arrastáveis à esquerda, o preview real (`BioPage`) no centro como superfície de edição, e um inspector à direita para as propriedades do item selecionado — sem tocar no schema (`bio.json`), sem trocar o motor de render do preview, e sem quebrar Identity/Appearance/Images/Advanced, que continuam como estão hoje.

O ponto mais delicado da demanda não é UI, é técnico: o preview é um **iframe** e precisa continuar sendo (é a mesma `BioPage` publicada). Arrastar da paleta (que vive no parent) para dentro do canvas (que vive no iframe) é um drag-and-drop **cross-frame**, e isso é o eixo central das decisões de arquitetura abaixo.

## 2. AS-IS vs TO-BE

| Aspecto | AS-IS | TO-BE |
|---|---|---|
| Layout da aba Conteúdo | Rail + formulários (accordion) + preview lateral | Paleta (esq.) + Canvas/preview (centro) + Inspector (dir.) |
| Adicionar card | Botões no rodapé do `SectionEditor`, append no fim | Arrastar da paleta, drop na posição desejada |
| Editar item | Abrir acordeão → `ItemEditor` inline | Selecionar no canvas → `ItemEditor` reaproveitado como Inspector |
| Reordenar cards | Drag HTML5 nativo dentro da lista (`SectionEditor`) | Drag direto no canvas (mesmo mecanismo do drop da paleta) |
| Reordenar seções | Drag HTML5 nativo (`SectionSidebar`) | Mantido como está (parent-only, sem risco) |
| Preview | Feedback passivo | Superfície de edição ativa, mas continua sendo `BioPage` real |
| Identity/Appearance/Images/Advanced | Painéis + preview lateral | Inalterados nesta migração |
| Schema `BioConfig`/`SectionItem` | — | Sem mudanças (endereçamento por `sectionId` + índice, como já é hoje) |

## 3. Arquitetura proposta

### 3.1 Decisão principal: iframe fica, DnD nativo HTML5 não atravessa a fronteira

**Não** trocar o preview por um render direto de `BioPage` no parent (perderíamos isolamento de estilo e teríamos que reimplementar o pipeline de publish/preview). **Não** usar `dragstart`/`drop` HTML5 nativo entre parent e iframe — é o padrão mais frágil que existe em DnD web (Safari e mobile quebram sistematicamente drag cross-frame nativo).

**Decisão:** drag-and-drop **por pointer events**, controlado 100% pelo parent, com a resolução do alvo (qual seção/índice) feita **dentro do iframe** via `document.elementFromPoint`, coordenada e comunicada pelo canal de `postMessage` que já existe. Zero libs novas.

Por que não `@dnd-kit` (ou similar): nenhuma lib de DnD do ecossistema React resolve nativamente drag cross-iframe — todas assumem um único documento. Adotar uma lib nova resolveria, no máximo, o reorder dentro do parent (que já funciona com HTML5 nativo) e não resolve o problema real (paleta → canvas dentro do iframe). Não há justificativa forte para a dependência.

### 3.2 Mecânica do drag cross-frame (sem lib nova)

1. `mousedown`/`pointerdown` num item da paleta (ou num card já renderizado no canvas, para reorder) inicia o "drag state" no parent — não é HTML5 `dragstart`, é rastreio manual de `pointermove`/`pointerup` no `document` do parent.
2. Um "ghost" flutuante (elemento `position: fixed` no parent, fora do iframe) segue o cursor.
3. A cada `pointermove` (throttle via `requestAnimationFrame`), o parent calcula a posição do cursor **relativa ao iframe** (`cursorX - iframeRect.left`, `cursorY - iframeRect.top`) e envia `bio-preview-drag-over` com essas coordenadas.
4. Dentro do iframe (`preview/main.tsx`), o handler usa `document.elementFromPoint(x, y)` para achar o card/seção mais próximo, calcula se o drop seria "antes" ou "depois" com base no ponto médio vertical do elemento, desenha um indicador de drop (linha/placeholder) via uma pequena camada de overlay já renderizada pelo próprio preview, e responde ao parent com `bio-preview-drop-target` contendo `{ sectionId, index, valid }`.
5. O parent guarda o último `drop-target` recebido (não precisa fazer nada visualmente com ele — quem desenha o indicador é o iframe).
6. No `pointerup`, o parent envia `bio-preview-drop` (confirmação); o iframe responde `bio-preview-drop-result` com o alvo final resolvido; o parent aplica a mutação via `commit(updater)` (criando o item com `createItem`/`createAppHero`, ou movendo o item existente).
7. Se o `pointerup` ocorrer fora de qualquer área válida, o parent cancela (`bio-preview-drag-cancel`) e nada é commitado.

Esse mesmo mecanismo serve para **dois payloads diferentes**:
- `{ kind: 'palette', itemType | preset }` → cria item novo (fluxo de adicionar).
- `{ kind: 'move', sectionId, itemIndex }` → reordena item existente (fluxo de reorder no canvas).

Isso unifica "adicionar da paleta" e "reordenar no canvas" numa única implementação de drag, reduzindo a superfície de código nova.

### 3.3 Layout: só a aba Conteúdo muda

`EditorApp` passa a renderizar, quando `activeTab === 'sections'`, um novo container `ContentCanvasEditor` com 3 colunas (Paleta | Canvas | Inspector) em vez de `SectionSidebar + SectionEditor + PreviewPanel`. As demais abas (`identity`, `appearance`, `images`, `advanced`) continuam usando o layout atual (formulário + `PreviewPanel` lateral), sem qualquer alteração estrutural.

```
xl:  ┌────────┬──────────┬────────────────────┬───────────┐
     │ Rail   │ Paleta   │ Canvas (BioPage)   │ Inspector │
     │ tabs   │          │ = preview iframe    │           │
     └────────┴──────────┴────────────────────┴───────────┘
```

`SectionSidebar` não desaparece: encolhe para uma **faixa de navegação de seções** acima do canvas (tabs/chips com o título de cada seção), mantendo a função de "ir para seção" e o reorder de seções (que continua 100% parent-side, HTML5 nativo, sem risco — não é alterado).

O acordeão do `SectionEditor` **é removido**. Sua função de "editar item selecionado" passa a ser do Inspector, que é o `ItemEditor` atual encapsulado num painel lateral, alimentado por `sectionId + itemIndex` (o mesmo par que `bio-preview-select` já entrega hoje ao clicar num card do preview).

### 3.4 Estratégia responsiva (desktop / tablet / mobile)

Reaproveita os mesmos breakpoints que o editor já usa hoje (`xl`, `md`, mobile) — o que muda entre os tiers não é "quanto cabe na tela" (isso o editor já resolve), é **como** Paleta/Canvas/Inspector se distribuem e **qual mecanismo de drop** faz sentido em cada um.

Premissa: o **canvas em si é sempre estreito** — a bio publicada é uma página de largura fixa tipo "link in bio" (~390–430px), independente do tamanho da tela do editor. O gargalo de espaço em telas menores é a Paleta e o Inspector ao redor do canvas, não o canvas.

| Tier | Largura | Layout | Interação principal |
|---|---|---|---|
| Desktop / iPad paisagem com trackpad (`xl`, ≥1280px) | 3 colunas fixas: Paleta \| Canvas \| Inspector | Drag contínuo (Fases 2/3) — mouse ou pointer; trackpad do iPad também dispara pointer events, então cai na mesma experiência |
| Tablet / iPad retrato (`md`, 768–1279px) | Canvas central full-width; Paleta e Inspector viram **drawers** acionados por uma toolbar fixa acima do canvas ("Componentes" / "Propriedades") | **Tap-to-place** (abaixo), não drag contínuo no MVP |
| Celular (`mobile`, <768px) | Canvas dentro do `PreviewSheet` (já existe hoje); Paleta e Inspector como **bottom sheets** | **Tap-to-place**; fallback de clique idêntico ao desktop |

**Por que não drag contínuo por toque em md/mobile no MVP:** touch drag cross-iframe empilha dois problemas de uma vez — (1) o mesmo desafio de coordenar `pointermove` ↔ `elementFromPoint` que já existe no desktop, e (2) o navegador precisa diferenciar "arrastar o card" de "rolar a página", o que normalmente exige `touch-action` suprimido seletivamente e um long-press para iniciar o drag sem brigar com o scroll. É o ponto de maior risco técnico do pacote inteiro, então fica fora do MVP para telas tocáveis.

**Tap-to-place (substitui o drag em md/mobile):** reaproveita a *mesma* resolução de alvo do drag de desktop (seção + índice via `elementFromPoint`), só que disparada por dois toques em vez de um arrasto contínuo:
1. Tocar num item da Paleta → o canvas destaca as posições válidas de drop (mesmo indicador visual usado no drag de desktop, calculado do mesmo jeito).
2. Tocar numa dessas posições → insere ali. Tocar fora cancela.

O mesmo padrão serve para mover um card existente: tocar para selecionar → aparecem os alvos válidos → tocar no destino. Como o toque num card também pode significar "editar", a seleção abre uma ação explícita ("Editar" abre o Inspector / "Mover" entra em modo tap-to-place) em vez de decidir isso por gesto.

**Fallback universal, em todos os tiers:** tocar/clicar num item da paleta com uma seção ativa insere no fim da seção (o comportamento de hoje, sem gesto nenhum) e reorder por setas ↑↓/alça numa lista compacta por seção — o mesmo fallback já previsto para acessibilidade (seção 9) serve, sem trabalho extra, como caminho mobile garantido caso o tap-to-place falhe ou o usuário prefira.

**iPad não é um caso especial:** por cair nos breakpoints por largura, iPad em paisagem com trackpad/teclado tende a cair em `xl` e ganhar drag completo; iPad em retrato ou split-view cai em `md` e usa tap-to-place + drawers. Não é necessário detectar "é iPad" — só largura, como o resto do editor já faz.

## 4. UX / fluxos

**Selecionar (já existe, só muda o destino visual):** clique num card no canvas → `bio-preview-select` → parent seta `focusItemIndex`/`activeSection` → em vez de abrir acordeão, abre o Inspector à direita com os campos do `ItemEditor`.

**Adicionar por drag:** arrastar um item da Paleta até uma seção no canvas → indicador de drop aparece dentro do canvas (desenhado pelo iframe) → soltar → `createItem`/`createAppHero` roda no parent → `commit()` insere na posição indicada.

**Adicionar por clique (fallback, sempre disponível):** clicar num item da paleta com uma seção ativa insere no fim da seção ativa — é o comportamento atual dos botões, preservado como caminho acessível e como caminho mobile no MVP.

**Reordenar:** arrastar um card já existente dentro do canvas — mesmo mecanismo do item 3.2, payload `move`.

**Empty state:** seção sem itens mostra um placeholder didático ("Arraste um componente da paleta, ou clique em um item ao lado") dentro do canvas.

**Mobile (ver fase 5):** sem drag cross-frame no MVP mobile — mantém os botões de adicionar e usa o Inspector como bottom sheet (reaproveitando `PreviewSheet`), com clique no card abrindo o sheet em vez do acordeão.

## 5. Modelo de dados

**Sem alteração em `BioConfig` / `BioSection` / `SectionItem`.** Endereçamento continua por `sectionId` + índice do item na lista, exatamente como o protocolo `bio-preview-select` já usa hoje — não é necessário introduzir `id` estável por item.

Estado novo é **só de editor**, efêmero, não persistido no `bio.json`:
- estado de drag (`kind`, payload, posição do ghost) — vive no parent, não em `config`.
- alvo de drop candidato — vive no iframe (overlay local) e é replicado ao parent apenas para decidir o commit final.

### Novas mensagens `postMessage` (parent ↔ iframe)

| Mensagem | Direção | Payload |
|---|---|---|
| `bio-preview-drag-over` | parent → iframe | `{ x, y, payload }` |
| `bio-preview-drop-target` | iframe → parent | `{ sectionId, index, valid }` |
| `bio-preview-drop` | parent → iframe | confirmação de soltura |
| `bio-preview-drop-result` | iframe → parent | `{ sectionId, index }` final, para o `commit()` |
| `bio-preview-drag-cancel` | parent → iframe | limpa indicador |

As mensagens existentes (`bio-preview-ready`, `bio-preview` sync, `bio-preview-select`) não mudam.

## 6. Fases de implementação

### Fase 1 — Canvas + Inspector (sem drag ainda)
Reorganiza o layout da aba Conteúdo para Paleta/Canvas/Inspector; paleta vira grade de itens clicáveis (mesma função dos botões atuais, com thumbnail/hint); remove o acordeão, `ItemEditor` passa a viver no Inspector, disparado pela seleção já existente no preview. `SectionSidebar` encolhe para faixa de navegação, reorder de seções inalterado.
**Critério de aceite:** editar um card hoje leva N cliques via acordeão; no MVP leva clique no card no canvas → Inspector abre com os mesmos campos, sem regressão de funcionalidade. Adicionar item por clique na paleta funciona igual a hoje (append no fim da seção ativa).

### Fase 2 — Drag da paleta para o canvas
Implementa o mecanismo de 3.2 completo: ghost, tradução de coordenadas, `elementFromPoint` no iframe, indicador de drop, criação do item na posição soltada.
**Critério de aceite:** arrastar um componente da paleta e soltar entre dois cards existentes insere exatamente naquela posição; soltar fora de uma área válida não altera o `config`.

### Fase 3 — Reorder de cards via canvas
Reaproveita o mecanismo da Fase 2 com payload `move`; mantém o handle `⠿`/setas como alternativa acessível.
**Critério de aceite:** reordenar arrastando no canvas produz o mesmo resultado que o reorder de lista atual; undo/redo desfaz o move como uma única ação.

### Fase 4 — Polish
Criar seção ao soltar fora de qualquer seção existente; atalhos de teclado (delete, duplicate); animações de ghost/placeholder.
**Critério de aceite:** cada item do polish é opt-in e não bloqueia as fases anteriores.

### Fase 5 — Mobile
Plano explícito, não drag completo: mantém paleta como lista de clique (Fase 1) e Inspector como bottom sheet reaproveitando `PreviewSheet`. Avaliar drag touch cross-frame como item futuro fora deste pacote.
**Critério de aceite:** fluxo de adicionar/editar funciona no mobile sem nenhum drag, usando só tap.

## 7. Arquivos impactados

### Novos
- `editor/src/components/ContentCanvasEditor.tsx` — layout de 3 colunas da aba Conteúdo (substitui a composição atual só para `activeTab === 'sections'`)
- `editor/src/components/ComponentPalette.tsx` — grade de componentes (lê `CARD_TYPES` e `APP_HERO_PRESET_LIST` de `editor/src/lib/bio.ts`)
- `editor/src/components/Inspector.tsx` — wrapper do `ItemEditor` atual como painel lateral, ligado a `sectionId`/`itemIndex`
- `editor/src/components/SectionNavStrip.tsx` — versão compacta do `SectionSidebar` (navegação, mantém reorder de seções)
- `editor/src/lib/dragBridge.ts` — estado de drag no parent + tradução de coordenadas + wrapper das novas mensagens `postMessage`

### Alterados
- `editor/src/EditorApp.tsx` — roteamento condicional de layout para a aba `sections`; novo estado de seleção compartilhado com o Inspector
- `editor/src/preview/main.tsx` — handlers de `bio-preview-drag-over`/`bio-preview-drop`, `elementFromPoint`, overlay de indicador de drop
- `editor/src/components/SectionEditor.tsx` — perde o acordeão e os botões de add (migram para Inspector/Palette); pode ser reduzido a lógica de seção (título/layout) reaproveitada dentro do Inspector quando a seleção é a seção, não um item
- `bio/src/components/BioSection.tsx` — pequenos hooks de overlay (classe/`data-*`) para o indicador de drop, sem alterar o HTML público fora do modo `data-bio-preview`

### Sem alteração
- `bio/src/types/bio.ts`, `editor/src/lib/auth.ts`, `IdentityForm.tsx`, `AppearanceForm.tsx`, `ImagesGallery.tsx`, `AdvancedPanel.tsx`, `bio/src/components/BioPage.tsx` (fora do overlay pontual em `BioSection`)

## 8. Critérios de aceite (globais)

- Nenhuma mudança de schema em `bio.json`; um bio salvo antes da migração abre e edita normalmente depois.
- Preview continua sendo a `BioPage` real publicada — nenhum renderer paralelo.
- Undo/redo (`commit`) cobre: adicionar por drag, adicionar por clique, mover por drag, editar propriedades no Inspector — cada um como uma entrada única no histórico.
- Save draft / publish inalterados na API.
- Clique num card do preview sempre sincroniza a seleção (Inspector), em qualquer fase.
- Fallback por clique (sem drag) sempre funcional, mesmo após a Fase 2/3 entrarem — é o caminho de acessibilidade e mobile.

## 9. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Drag cross-frame é frágil por natureza | Não usar HTML5 DnD nativo cross-frame; usar pointer events + `postMessage` + `elementFromPoint`, conforme 3.2 |
| Deriva de coordenadas (scroll/resize do canvas durante o drag) | Recalcular `iframeRect` a cada `pointermove` antes de traduzir a coordenada, não cachear |
| Performance de `postMessage` em alta frequência | Throttle via `requestAnimationFrame`; só reenviar `drag-over` quando a célula-alvo muda, não a cada pixel |
| Mobile: drag touch cross-frame | Fora do MVP mobile (Fase 5); caminho por clique/tap sempre disponível |
| Acessibilidade: interações drag-only excluem teclado/leitor de tela | Manter sempre o caminho por clique/botão + setas como alternativa não-drag, em paridade de fase |
| Granularidade do undo durante o drag | Só commitar no `pointerup` final (drop confirmado); estados intermediários do drag não tocam `config`/`past` |
| Overlay de drop divergir visualmente do HTML público | Overlay controlado só por classe/`data-*` ligada a `document.documentElement.dataset.bioPreview`, sem alterar o markup usado na bio publicada |

## 10. Fora de escopo

- Reescrever Identity/Appearance/Images/Advanced.
- Remover o iframe ou trocar o pipeline de preview/publish.
- Adotar `@dnd-kit` ou qualquer lib de DnD nova.
- Migração de schema/breaking change em `bio.json`.
- Drag completo (touch) no mobile — fica como item futuro após a Fase 5.
- Multi-seleção de cards.
- Alterações em PHP/painel ou no fluxo de atualização remota.
