# Prompt — Motor de cores (contraste + gradiente custom + defaults)

Use este prompt **junto** com o snapshot de código:

`docs/docs_claude/codigo-motor-cores/SNAPSHOT.md`

Entregue um **patch guiado** (Antes/Depois por arquivo) + qualquer arquivo novo completo.
Não invente libs pesadas. Prefira utilitários autocontidos (como `appHeroContrast.ts`).
Responda em português do Brasil.

---

## Contexto do produto

Monorepo `insta-bio`: bio pública (`bio/`) + editor (`editor/`).
Tema da bio = `brand.theme` em `bio/src/types/bio.ts`:

```ts
theme: {
  primary: string
  secondary?: string
  glow?: string
  background?: string          // cor sólida CSS
  backgroundImage?: string
  backgroundPreset?: string    // ID de BACKGROUND_PRESETS (gradiente radial pronto)
  cardRadius?: number
}
```

Prioridade de fundo na página (`BioPage.tsx`):
**imagem > preset de gradiente > cor sólida > default escuro CSS**.

Hoje:
- Gradiente de **página** só via lista fixa `BACKGROUND_PRESETS` (sem builder custom).
- Cor sólida OU vazio (preto padrão) — **sem gradiente customizado de página**.
- `GradientField` já existe, mas só para **cards** (`feature` / `grid` / Instagram).
- Contraste adaptativo existe **só** para `AppHeroCard` (`appHeroContrast.ts`).
- `FeatureCard` / `GridCard` usam `text-white` fixo + gradient hardcoded/fallback.
- Títulos de seção usam `text-primary` — em fundos próximos da primária (ex. teal + mint) o contraste some.
- `createItem()` **não** recebe o tema atual → cards novos nascem com gradient laranja fixo (grid) ou sem gradient (feature), ignorando as cores escolhidas.

Problema real (screenshot): fundo teal vivo + primária mint → "SERVIÇOS" ilegível; card Instagram glass com badge rosa lavado; texto branco no painel semi-claro.

---

## Objetivos (3 frentes)

### A) Motor de contraste unificado e eficiente

Criar (ou evoluir) um **motor único** de contraste/cores, reutilizável por:

| Consumidor | Hoje | Meta |
|---|---|---|
| AppHero | `resolveAppHeroTheme` | Continuar funcionando; idealmente reusar o motor base |
| Feature / Grid | `text-white` fixo | Texto/borda adaptativos ao gradient + fundo da página |
| Links / templates pill-solid | `resolvePrimarySurfaceColors` | Manter; alinhar parsing com o motor |
| Títulos de seção (`BioSection`) | `text-primary` cego | Cor de contraste legível sobre o fundo efetivo |
| Criação de cards | hardcoded | Defaults derivados do tema |

**Requisitos do motor:**

1. **Parse eficiente** — uma API clara, sem duplicar `parseColor`/`relativeLuminance` em 3 arquivos. Unificar o que houver em `contrastColor.ts`, `appHeroContrast.ts`, `extractImagePalette.ts` (parte de luminância) e `editor/src/lib/color.ts` onde fizer sentido (sem quebrar pickers).
2. **Lookup barato** — funções puras, O(1)~O(n stops). Sem canvas/DOM no hot path da bio (exceto o fluxo já existente de sugerir cores da imagem).
3. **API sugerida** (ajuste se justificar):

```ts
// bio/src/lib/colorEngine.ts  (nome livre, desde que claro)

resolveEffectiveBioBackground(input) → string   // já existe em appHeroContrast — consolidar

contrastTextOn(bg: string): { title: string; body: string; muted: string }
// branco/preto (ou equivalentes) com contraste WCAG razoável

ensureContrast(fg: string, bg: string, minRatio?: number): string
// escurece/clareia fg mantendo matiz (color-mix) até atingir ratio

resolveCardSurface(gradientOrColor: string, pageBackground: string): {
  background: string   // pode incluir scrim
  titleText: string
  bodyText: string
  border?: string
}

deriveThemeFromBackground(pageBg: string): {
  primary: string
  secondary: string
  glow: string
  // cores que contrastam com o fundo
}

deriveCardGradientFromTheme(theme: { primary: string; secondary?: string }): string
// linear-gradient usável em feature/grid novos
```

4. **Critérios de aceite (contraste):**

| Fundo | Esperado |
|---|---|
| Preto / preset escuro (oceano) | Visual atual preservado — sem regressão |
| Teal/cian vivo + primary mint/clara | Título de seção e textos `primary` legíveis (motor ajusta primary efetiva OU cor do título) |
| Creme/branco | AppHero e Feature/Grid com scrim + texto branco legível; card não “some” no fundo |
| Primária clara em botão preenchido | Continua escurecendo via `resolvePrimarySurfaceColors` (ou sucessor) |

5. **Não fazer:** sampling de imagem em runtime na bio pública; não exigir config nova por card.

---

### B) Gradiente customizado de fundo no editor

Na aba **Fundo** de `AppearanceForm`:

Hoje: presets prontos + imagem + **cor sólida**.

Meta: botão/modo **“Gradiente personalizado”** que permita:
- 2 cores (início/fim) + ângulo **ou** tipo radial simples (spotlight)
- Reusar UI de `GradientField` (já existe) o máximo possível
- Persistir no tema sem quebrar clientes antigos

**Sugestão de modelo** (escolha a menos invasiva e justifique):

**Opção 1 (preferida):** estender `theme.background` para aceitar também string CSS de `linear-gradient(...)` / `radial-gradient(...)` (já é `string`). UI grava o CSS completo em `background`, limpa `backgroundPreset`. `BioPage` já usa `background` como CSS — verificar se `bg-background` / `--color-background` precisam de `edgeColor` derivado (cor do stop mais escuro ou média) para cards/overlays.

**Opção 2:** novo campo `theme.backgroundGradient?: string` + flag. Só se Opção 1 quebrar algo.

Comportamento:
- Ao ativar gradiente custom → limpar `backgroundPreset` (como faz a cor sólida).
- Preview na aba Fundo (swatch grande).
- Botão “Usar cor sólida” / “Usar gradiente” para alternar modo.
- Ao aplicar preset pronto, continua sobrescrevendo como hoje.
- Imagem continua com prioridade máxima.

---

### C) Cards novos já nascem com contraste/cores do tema

`createItem` / `createAppHero` / `addItem` hoje **não** recebem `brand.theme`.

Meta:
1. Assinatura passa a receber o tema (ou um helper `deriveCardGradientFromTheme`).
2. `feature` (variant gradient): já cria com `gradient` derivado de `primary`/`secondary`.
3. `grid`: troca o oklch laranja fixo pelo gradient derivado.
4. Textos do card (quando aplicável) devem renderizar com contraste do motor — mesmo se o gradient for editado depois.
5. `app-hero` preset `custom`: já usa CSS vars — ok. Presets de marca (WhatsApp etc.) mantêm identidade; contraste via `resolveAppHeroTheme` (já integrado).
6. **Não** reescrever cards já salvos no `bio.json` automaticamente (sem migração surpresa). Só defaults na **criação**.

Pontos de wiring:
- `editor/src/lib/bio.ts` → `createItem`
- `editor/src/components/SectionEditor.tsx` → `addItem` / `addAppHero`
- Render: `FeatureCard.tsx`, `GridCard.tsx` (texto dinâmico como AppHero)

---

## Restrições

- Sem dependências npm novas (sem chroma-js, polished, etc.), salvo justificativa forte.
- Manter compatibilidade com `bio.json` existente.
- Não mexer em fluxo de update remoto / PHP / painel.
- Preservar identidade de marca nos presets AppHero (`iconColor` WhatsApp/YouTube…).
- Editor e bio compartilham lógica via `@site/*` → `bio/src/*` quando possível (motor vive em `bio/src/lib/`).
- TypeScript estrito; rodar mentalmente `tsc` bio + editor.
- Commits/mensagens não são sua tarefa — só o patch.

---

## Formato da entrega

1. **Resumo** (½ página): decisões (API do motor, modelo do gradiente de página, wiring createItem).
2. **Arquivo(s) novos** completos.
3. **Patch Antes/Depois** nos arquivos existentes (trechos exatos, como em `INTEGRACAO-CONTRASTE-APP-HERO.md`).
4. **Checklist de teste manual** (fundos: preto, oceano, teal vivo, creme, imagem; criar feature/grid novos; editar gradiente custom de página).
5. **O que NÃO mudou** (lista explícita).

---

## Inventário rápido (detalhe no SNAPSHOT.md)

| Arquivo | Papel |
|---|---|
| `bio/src/lib/contrastColor.ts` | Superfícies primary → texto branco |
| `bio/src/lib/appHeroContrast.ts` | Contraste AppHero + fundo efetivo |
| `bio/src/lib/backgroundPresets.ts` | Gradientes prontos de página |
| `bio/src/lib/appHeroPresets.ts` | Temas fixos por app |
| `bio/src/components/BioPage.tsx` | Vars CSS + camadas de fundo + `pageBackground` |
| `bio/src/components/AppHeroCard.tsx` | Já usa theme resolvido |
| `bio/src/components/FeatureCard.tsx` / `GridCard.tsx` | Gradient + `text-white` fixo |
| `bio/src/components/BioSection.tsx` | Título `text-primary` |
| `editor/src/components/AppearanceForm.tsx` | UI Fundo/Cores |
| `editor/src/components/GradientField.tsx` | Editor 2 cores + ângulo (cards) |
| `editor/src/components/ColorField.tsx` | Pickers |
| `editor/src/lib/bio.ts` | `createItem` sem tema |
| `editor/src/lib/color.ts` / `colorPalettes.ts` / `extractImagePalette.ts` | Helpers do editor |

---

## Prompt curto (copiar/colar)

```
Você é um engenheiro sênior no monorepo insta-bio (bio React + editor).

Leia PROMPT-MOTOR-CORES.md e o SNAPSHOT.md anexado.

Implemente (em forma de patch Antes/Depois + arquivos novos):
1) Motor de cores/contraste unificado e eficiente (bio/src/lib/), cobrindo AppHero,
   Feature/Grid, títulos de seção e superfícies primary — sem regressão em fundo escuro.
2) No AppearanceForm, modo "gradiente personalizado" de fundo de página (reusar
   GradientField se possível); persistir de forma compatível com bio.json antigo.
3) createItem/addItem: cards feature/grid novos já nascem com gradient derivado
   do tema atual; render com texto de contraste (não text-white cego).

Restrições: sem libs novas; sem migração automática de bio.json antigo; sem PHP;
preservar presets AppHero de marca; TypeScript ok.

Entrega: resumo de decisões, código novo completo, patches Antes/Depois,
checklist de testes manuais, lista do que não mudou.
```
