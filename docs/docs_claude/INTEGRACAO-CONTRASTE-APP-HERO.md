# Integração — Contraste adaptativo no AppHeroCard

Este ambiente não tem acesso ao monorepo real (sem repo, sem rede) — a
entrega é `appHeroContrast.ts` pronto + este patch guiado para os 2 arquivos
reais descritos em `docs/docs_claude/INSTRUCOES-CONTRASTE-APP-HERO.md`. Os
trechos "Antes / Depois" abaixo usam o código exato que está nesse arquivo.

## Arquivo novo

Copiar `appHeroContrast.ts` (anexo) para `bio/src/lib/appHeroContrast.ts`.

Ele importa `AppHeroTheme` de `./appHeroPresets` — não precisa mexer em
`appHeroPresets.ts`, só ele precisa exportar esse tipo (já é o caso, conforme
o arquivo de instruções).

## `AppHeroCard.tsx`

### 1. Import

```tsx
import { resolveAppHeroTheme } from '../lib/appHeroContrast'
```

### 2. Ponto de injeção — troca o theme cru pelo resolvido

Antes:

```tsx
export function AppHeroCard({ item, grid = false }: { item: AppHeroLike; grid?: boolean }) {
  const preset = resolvePreset(item)
  const theme = APP_HERO_PRESETS[preset].theme // ← ponto de injeção do theme adaptado
  const customIcon = item.type === 'app-hero' ? item.icon : undefined
  const layout = resolveLayout(item, grid)
  const align = resolveAlign(item)
  const showIcon = resolveShowIcon(item, preset)
  const props = { item, preset, theme, icon: customIcon, showIcon, align }
```

Depois:

```tsx
export function AppHeroCard({
  item,
  grid = false,
  pageBackground = '#000000',
}: {
  item: AppHeroLike
  grid?: boolean
  /** Fundo efetivo da bio — ver BioPage.tsx (resolveEffectiveBioBackground). */
  pageBackground?: string
}) {
  const preset = resolvePreset(item)
  const theme = resolveAppHeroTheme(APP_HERO_PRESETS[preset].theme, pageBackground)
  const customIcon = item.type === 'app-hero' ? item.icon : undefined
  const layout = resolveLayout(item, grid)
  const align = resolveAlign(item)
  const showIcon = resolveShowIcon(item, preset)
  const props = { item, preset, theme, icon: customIcon, showIcon, align }
```

`pageBackground` com default `'#000000'` evita quebrar qualquer chamador que
ainda não passe a prop (preview isolado, storybook, etc.) — cai exatamente no
comportamento de hoje.

### 3. Tipo do `theme` nos sub-componentes

`HeroShell`, `HeroDefault` (e por padrão `HeroCompact`/`HeroCondensed`) tipam
`theme` como `(typeof APP_HERO_PRESETS)[AppHeroPreset]['theme']`. Trocar por
`ResolvedAppHeroTheme` (importado de `../lib/appHeroContrast`), já que agora
o objeto tem `titleText`/`bodyText` a mais:

```tsx
import type { ResolvedAppHeroTheme } from '../lib/appHeroContrast'

function HeroShell({ item, theme, children, className = '' }: {
  item: AppHeroLike
  theme: ResolvedAppHeroTheme
  children: ReactNode
  className?: string
}) { /* ... resto igual ... */ }
```

Repetir a troca de tipo em `HeroDefault`, `HeroIconBox`, `HeroCompact` e
`HeroCondensed` (todo lugar que hoje tipa `theme` como
`(typeof APP_HERO_PRESETS)[AppHeroPreset]['theme']`).

### 4. Remover `text-white` fixo — usar `theme.titleText` / `theme.bodyText`

Em `HeroDefault` (e o mesmo padrão em `HeroCompact`/`HeroCondensed`, que
segundo o arquivo de instruções repetem essa estrutura):

Antes:

```tsx
<h3 className="mt-1 text-xl font-bold leading-tight text-white">{item.title}</h3>
<p className="mt-1.5 text-xs leading-relaxed text-white/85 sm:text-sm">{item.description}</p>
```

Depois:

```tsx
<h3 className="mt-1 text-xl font-bold leading-tight" style={{ color: theme.titleText }}>
  {item.title}
</h3>
<p className="mt-1.5 text-xs leading-relaxed sm:text-sm" style={{ color: theme.bodyText }}>
  {item.description}
</p>
```

Nada mais muda nesse bloco — `badgeText`, `ctaBg`, `ctaText`, `ctaShadow`
continuam lidos de `theme.*` exatamente como hoje (o CTA nem precisa de
mudança de JSX: quando `resolveAppHeroTheme` reforça o CTA, ela já devolve
`ctaShadow` com o anel de contraste embutido, então
`style={{ background: theme.ctaBg, color: theme.ctaText, boxShadow: theme.ctaShadow }}`
continua funcionando sem alteração).

### 5. `HeroIconBox` / ícone

Sem mudanças — `iconColor`, `iconBg`, `iconRing`, `pulseBorder` já vêm do
`theme` resolvido (só `pulseBorder` é ajustado quando a página é clara; os
outros dois ficam como estão porque o box do ícone já se apoia no painel,
que é o que a função escurece quando precisa).

## `BioPage.tsx` — calcular e passar `pageBackground`

Perto de onde `brand.theme.background` / `backgroundPreset` /
`backgroundImage` já são lidos:

```tsx
import { resolveEffectiveBioBackground } from '../lib/appHeroContrast'

const pageBackground = resolveEffectiveBioBackground({
  background: brand.theme.background,
  backgroundPresetColor: resolvedBackgroundPresetColor, // se existir esse mapeamento hoje; senão, omitir
  hasBackgroundImage: Boolean(brand.theme.backgroundImage),
})
```

E passar em cada `<AppHeroCard item={...} grid={...} pageBackground={pageBackground} />`.

> Se `backgroundPreset` já resolve para uma cor em outro lugar (ex.:
> `PRESET_COLORS[backgroundPreset]`), use esse valor como
> `backgroundPresetColor`. Se não existir hoje, pode omitir — cai no
> fallback preto, sem regressão.

## Testes manuais (mapeados nos critérios de aceite)

Testar cada preset (WhatsApp, YouTube, Instagram, Telegram, formulário,
`custom`) nesses fundos, em todos os layouts (`default`/`compact`/`condensed`)
e nos dois `align` (`side`/`center`):

| Fundo da bio | Esperado |
|---|---|
| Preto (`#000000`, sem imagem) | Visual idêntico ao atual — `gradient`/`border`/textos não mudam |
| Claro/creme (ex. `#F5F0E8`) | `gradient` ganha scrim escuro, título/descrição continuam brancos e legíveis sobre o painel escurecido, `border`/`glow` não ficam "lavados" |
| Verde próximo ao WhatsApp (`#22C55E`) + preset WhatsApp | `ctaBg` ganha reforço leve + anel; botão continua distinguível e ainda reconhecível como verde WhatsApp |
| Vermelho + preset YouTube | Mesma checagem, com vermelho |
| Preset `custom` | `ctaBg`/`ctaText` (tokens) sem alteração; `titleText`/`bodyText` seguem dinâmicos normalmente |
| Bio com imagem de capa configurada | Cai no fallback escuro — comportamento igual ao de "fundo preto" |
| Preset `custom` sem `icon` (item `app-hero`) | `showIcon` continua `false` — função de contraste não mexe nisso |

Rodar `tsc`/build de `bio` + `editor` depois de aplicar as mudanças em
`AppHeroCard.tsx` e `BioPage.tsx`.

## O que este pacote NÃO faz (por falta de acesso ao repo)

- Não editei `AppHeroCard.tsx`/`BioPage.tsx` diretamente — os trechos "Antes/
  Depois" acima são para colar à mão nesses arquivos reais (o "Antes" usa o
  código exato do arquivo de instruções; se o arquivo real tiver divergido
  um pouco desde então, ajuste ao redor da mesma linha
  `const theme = APP_HERO_PRESETS[preset].theme`).
- Não toquei em `appHeroPresets.ts` nem em `contrastColor.ts`.
- Não mexi no fluxo de update remoto / PHP.
- Não adicionei nenhuma config nova no editor — o ajuste é automático a
  partir do fundo já configurado na bio.
