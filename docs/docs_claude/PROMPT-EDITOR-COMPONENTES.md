# Prompt — Editor visual de componentes (migração do editor da bio)

**Objetivo deste pacote:** você (Claude / outro modelo) deve **entender a demanda**, **propor a arquitetura** e **entregar um documento técnico executável** (fases, arquivos, UX, riscos).  
**Não implemente código agora.** O documento técnico será aplicado depois no Cursor.

Responda em **português do Brasil**.

---

## Prompt curto (copiar/colar no chat)

```
Você é um engenheiro sênior de produto/front-end.

Anexei o arquivo PROMPT-EDITOR-COMPONENTES.md com:
- como o editor da bio funciona HOJE (formulários + preview iframe)
- estrutura de arquivos e modelos de código
- a visão do editor NOVO (canvas central + paleta de componentes arrastáveis)

Sua tarefa NÃO é escrever o código da migração agora.
Sua tarefa é:

1) Confirmar entendimento da demanda (resumo curto)
2) Comparar AS-IS vs TO-BE
3) Propor solução técnica realista para o monorepo insta-bio
4) Entregar um DOCUMENTO TÉCNICO completo e executável

O documento técnico deve incluir:
- Decisão de arquitetura (layout, estado, DnD, preview)
- O que reaproveitar vs o que reescrever
- Modelo de interação (arrastar da paleta → página/seção; selecionar → inspector)
- Impacto em BioConfig / SectionItem (schema — preferir zero breaking change)
- Plano por fases (MVP → polish), com critérios de aceite
- Lista de arquivos a criar/alterar
- Riscos (mobile, undo, performance postMessage, acessibilidade)
- O que NÃO fazer nesta migração

Restrições:
- Sem libs novas sem justificativa forte (se propor @dnd-kit ou similar, diga por quê)
- Manter bio.json compatível (sem migração obrigatória de clientes)
- Preview deve continuar renderizando BioPage real (não um mock divergente)
- Identity / Appearance / Images / Advanced podem permanecer como painéis, mas a edição de CONTEÚDO (seções/cards) deve virar o editor visual
- Mobile precisa de caminho viável (mesmo que MVP desktop-first)
- Resposta só em markdown: DOCUMENTO TÉCNICO pronto para eu entregar ao Cursor executar

Formato da entrega:
# Documento técnico — Editor visual de componentes
## 1. Entendimento
## 2. AS-IS vs TO-BE
## 3. Arquitetura proposta
## 4. UX / fluxos
## 5. Modelo de dados
## 6. Fases de implementação
## 7. Arquivos impactados
## 8. Critérios de aceite
## 9. Riscos e mitigação
## 10. Fora de escopo
```

---

## 1. Visão do produto (TO-BE)

Queremos sair de um editor **centrado em formulários** para um editor **centrado em componentes**, mais dinâmico e didático.

### Experiência desejada (edição de seções / conteúdo)

```
┌──────────────┬─────────────────────────────┬─────────────────┐
│ Paleta       │  Preview / Canvas (centro)  │ Inspector       │
│ componentes  │  (a bio como o usuário vê)  │ (props do item  │
│ arrastáveis  │  drop zones nas seções      │  selecionado)   │
└──────────────┴─────────────────────────────┴─────────────────┘
```

Ideias-chave:

1. **Preview no centro** — a bio ao vivo é o palco principal (não um painel lateral secundário).
2. **Componentes na paleta** — WhatsApp, YouTube, Destaque, Link, Vídeo, etc. com visual/thumbnail/hint.
3. **Arrastar para a página** — drop na seção ativa (ou criar seção), com placeholder visual.
4. **Selecionar no canvas** — clique no card → destaca + abre propriedades no inspector (reuso dos campos atuais do `ItemEditor`).
5. **Reordenar no canvas** — drag entre cards / seções (hoje só existe reorder em listas HTML5).
6. **Didático** — empty states, tooltips, “solte aqui”, primeiros passos claros para quem não é técnico.

Identity (perfil), Appearance (cores/fundo), Images e Advanced **podem** continuar como abas/painéis — o salto principal é a aba **Conteúdo / Seções**.

---

## 2. Como funciona HOJE (AS-IS)

### Layout atual (`EditorApp`)

```
┌────────┬──────────────────────────┬─────────────────┐
│ Rail   │  Main (FORMULÁRIOS)      │ Preview iframe  │
│ tabs   │  IdentityForm /          │ ~400px (xl)     │
│        │  AppearanceForm /        │ sticky          │
│        │  SectionSidebar +        │                 │
│        │  SectionEditor +         │                 │
│        │  ItemEditor (acordeão)   │                 │
└────────┴──────────────────────────┴─────────────────┘
```

- **xl:** rail + forms + preview  
- **md:** forms + preview  
- **mobile:** forms + FAB → `PreviewSheet` (preview em sheet)

Edição é **100% form-driven**. O preview é **feedback visual** (não é canvas de edição).

### Abas do rail

| Tab | UI | Conteúdo |
|-----|-----|----------|
| `identity` | Identidade | `IdentityForm` |
| `appearance` | Aparência | `AppearanceForm` (sub: Fundo / Cores / Links) |
| `sections` | Conteúdo | `SectionSidebar` + `SectionEditor` |
| `images` | Arquivos | `ImagesGallery` (só mode full) |
| `advanced` | Config | `AdvancedPanel` (só mode full) |

### Fluxo de edição de conteúdo hoje

1. Usuário escolhe aba **Conteúdo**.
2. Escolhe uma **seção** na sidebar (ou mobile picker).
3. Em `SectionEditor`: edita título/layout da seção.
4. Cards em **acordeão** (`expandedIndex`); só um aberto.
5. Dentro do card aberto: `ItemEditor` com campos por `item.type`.
6. Para **adicionar**: botões no rodapé (`+ WhatsApp`, `+ Destaque`, …) — append no fim da lista.
7. Preview (iframe) recebe `config` via `postMessage` e re-renderiza `BioPage`.
8. Clique no card no preview → `bio-preview-select` → parent abre o acordeão correspondente.

**Não há:** drag da paleta para o preview, drop zones, edição WYSIWYG, inspector lateral ligado ao canvas.

### Preview (já existe e deve ser reaproveitado)

```
EditorApp → PreviewPanel (iframe preview.html)
                ↕ postMessage
         preview/main.tsx → BioPage
```

| Mensagem | Direção | Uso |
|----------|---------|-----|
| `bio-preview-ready` | iframe → parent | iframe pronto |
| `bio-preview` + `{ config, focus, bioJsonPath }` | parent → iframe | sync live |
| `bio-preview-select` + `{ sectionId, itemIndex }` | iframe → parent | clique no card |

Modo preview na bio: `document.documentElement.dataset.bioPreview = '1'` → cards ficam selecionáveis (`BioSection`).

### Estado (centralizado em `EditorApp`)

| Estado | Função |
|--------|--------|
| `config: BioConfig` | documento editável |
| `past` / `future` | undo/redo (limite 50) via `commit()` |
| `savedSnapshot` | dirty check |
| `activeTab` / `activeSection` | navegação |
| `focusItemIndex` | destaque no preview |
| `openItemRequest` | abre acordeão a partir do preview |

Mutação estruturada: **`commit(updater)`** — ponto de encaixe para qualquer store futuro.

Persistência (mode `full`): draft `bio.draft.json` / publish `bio.json`. Mode `demo`: sem save.

### Drag-and-drop que JÁ existe

- **HTML5 nativo** (sem `@dnd-kit`):
  - reorder de **seções** (`SectionSidebar`)
  - reorder de **cards** dentro da seção (`SectionEditor`, handle `⠿`)
- Slides/products: só setas ↑↓
- **Não** há DnD paleta → canvas

### Paleta de add-card hoje

Rodapé do `SectionEditor` (botões, não thumbnails arrastáveis):

- Destaques de app: `APP_HERO_PRESET_LIST` → `createAppHero(preset)`
- Outros: `CARD_TYPES` → `createItem(type, theme?)`

---

## 3. Modelos de código / dados

### Schema (`bio/src/types/bio.ts` — alias `@bio-types`)

```ts
BioConfig {
  brand: BioBrand      // nome, tagline, logo, theme, template, social…
  sections: BioSection[]
}

BioSection {
  id: string
  title: string
  subtitle?: string
  layout?: 'stack' | 'grid-2'
  items: SectionItem[]
}

SectionItem =
  | AppHero | WhatsAppHero
  | FeatureCard | LinkCard | GridCard
  | LocationCard | VideoCard | SlideCard
  | ProductsCard | YoutubeEmbed | SpotifyEmbed
  | …
```

Tema relevante:

```ts
brand.theme: {
  primary, secondary?, glow?,
  background?, backgroundImage?, backgroundPreset?,
  cardRadius?
}
```

### Defaults de criação (`editor/src/lib/bio.ts`)

- `createItem(type, theme?)` — feature/grid já derivam gradient do tema
- `createAppHero(preset)` — presets WhatsApp/YouTube/…
- `createSection`, `cloneItem`, `ensureGridHeroLayouts`, `newHeroItemForSection`
- `CARD_TYPES` — inventário da paleta “outros”
- `APP_HERO_PRESET_LIST` — inventário dos destaques de app

### Render público (preview = produção)

- `bio/src/components/BioPage.tsx` — página
- `bio/src/components/BioSection.tsx` — seção + select no preview
- Cards: `AppHeroCard`, `FeatureCard`, `LinkCard`, `GridCard`, …

**Regra de ouro:** o preview deve continuar sendo a **mesma** `BioPage` da bio publicada — não inventar um renderer paralelo.

---

## 4. Mapa de arquivos relevantes (AS-IS)

### Core editor
| Arquivo | Papel |
|---------|--------|
| `editor/src/EditorApp.tsx` | shell, tabs, estado, save, layout |
| `editor/src/main.tsx` / `App.tsx` | entry full |
| `editor/src/preview/main.tsx` | runtime do iframe |
| `editor/src/lib/bio.ts` | createItem, CARD_TYPES, normalize |
| `editor/src/lib/auth.ts` | load/save/publish |

### Conteúdo (foco da migração)
| Arquivo | Papel |
|---------|--------|
| `editor/src/components/SectionEditor.tsx` | seção + acordeão + add buttons + DnD lista |
| `editor/src/components/ItemEditor.tsx` | form por tipo de card |
| `editor/src/components/SectionSidebar.tsx` | lista/reorder seções |
| `editor/src/components/PreviewPanel.tsx` | iframe + postMessage |
| `editor/src/components/PreviewSheet.tsx` | preview mobile |

### Outros painéis (manter, integrar depois)
| Arquivo | Papel |
|---------|--------|
| `IdentityForm.tsx` | perfil |
| `AppearanceForm.tsx` | fundo/cores/links |
| `ImagesGallery.tsx` | mídia |
| `AdvancedPanel.tsx` | JSON, updates, paths |

### Bio (render)
| Arquivo | Papel |
|---------|--------|
| `bio/src/types/bio.ts` | schema |
| `bio/src/components/BioPage.tsx` | página |
| `bio/src/components/BioSection.tsx` | select no preview |

---

## 5. Requisitos da solução (o que o documento técnico deve resolver)

### Obrigatório
1. Canvas/preview **no centro** na edição de conteúdo.
2. Paleta de componentes (visual) com **drag → drop** na seção/página.
3. Seleção no canvas abre **inspector** com propriedades (reusar lógica do `ItemEditor`).
4. Reorder visual de cards (e idealmente seções).
5. Empty states didáticos (“Arraste um card para começar”).
6. Compatibilidade total com `bio.json` existente.
7. Undo/redo continua funcionando (`commit` ou equivalente).
8. Save draft / publish inalterados na API.
9. Clique no preview continua sincronizando seleção.

### Desejável
- Drop indicator / ghost card
- Criar seção ao dropar “fora”
- Atalhos teclado (delete, duplicate)
- Desktop-first com plano mobile explícito

### Restrições
- Preferir **zero breaking change** no schema
- Não divergir o HTML da bio pública só para o editor (overlays de edição via CSS/`data-*`/camada no parent são ok)
- Sem PHP/painel nesta migração
- Sem reescrever Identity/Appearance no MVP, salvo encaixe de layout

---

## 6. Perguntas que o documento técnico DEVE responder

1. O canvas é o **iframe atual** com overlays, ou um **render React direto** de `BioPage` no parent (sem iframe)? Trade-offs.
2. Onde vive a paleta (esquerda fixa) e o inspector (direita / drawer)?
3. Qual lib de DnD (HTML5 evoluído vs `@dnd-kit`)? Justificar.
4. Como mapear drop position → `sectionId` + `itemIndex`?
5. O `ItemEditor` vira o inspector ou é reescrito em painéis menores?
6. O que acontece com `SectionSidebar` / acordeão atual?
7. MVP em quantas fases? O que entra no Fase 1 para já ser usável?
8. Como o mobile fica no MVP (sheet + lista vs canvas simplificado)?

---

## 7. Formato esperado da sua resposta

Entregue **apenas** o documento técnico markdown, com as seções listadas no prompt curto.

Seja concreto: nomes de componentes novos sugeridos, arquivos, e ordem de implementação.  
Evite genericidades (“usar boas práticas”); amarre à estrutura AS-IS acima.

**Não** gere patches de código longos. No máximo esqueleto de API/interfaces se ajudar o plano.

---

## 8. Critério de sucesso deste briefing

Ao final, um engenheiro no Cursor deve conseguir ler o documento técnico e executar a migração **sem reler todo o editor**, sabendo:

- o que construir primeiro,
- o que reaproveitar,
- o que não quebrar,
- como validar.
