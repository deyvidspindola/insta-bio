# Contraste adaptativo nos cards de destaque (app-hero / WhatsApp)

## Objetivo

Os cards de destaque (`AppHeroCard` — WhatsApp, YouTube, Instagram, Telegram, formulário, personalizado) ficam ótimos sobre **fundo preto**, mas em fundos coloridos/claros o contraste cai: texto branco some, CTA da marca (ex. verde WhatsApp `#25D366`) “some” no fundo, bordas e glow ficam sujos.

Precisamos de um sistema que **adapte contraste** conforme o fundo da bio, **sem perder a identidade** das cores padrão de cada app (verde WhatsApp, vermelho YouTube, etc.).

Não basta inverter tudo para preto/branco. A cor da marca deve continuar reconhecível.

---

## Contexto no monorepo `insta-bio`

| Peça | Arquivo |
|------|---------|
| Temas fixos por preset | `bio/src/lib/appHeroPresets.ts` |
| Render do card | `bio/src/components/AppHeroCard.tsx` |
| Fundo da bio | `brand.theme.background` / `backgroundPreset` / `backgroundImage` via `BioPage.tsx` |
| Utilitário de contraste existente | `bio/src/lib/contrastColor.ts` |

**Problema estrutural atual:** título/descrição usam classes fixas `text-white` / `text-white/85` no JSX — **não** vêm do theme. Só badge, CTA, ícone, borda e gradient usam `theme.*`. Qualquer solução de contraste precisa também tornar as cores de texto do card dinâmicas (via style ou classes condicionais).

---

## Modelo atual — tipos e theme (`appHeroPresets.ts`)

```ts
export interface AppHeroTheme {
  border: string
  borderHover: string
  gradient: string
  glow: string
  badgeText: string
  iconBg: string
  iconRing: string
  iconColor: string
  pulseBorder: string
  ctaBg: string
  ctaText: string
  ctaShadow: string
}

export interface AppHeroPresetConfig {
  label: string
  defaults: Pick<AppHero, 'badge' | 'title' | 'description' | 'cta' | 'url'>
  theme: AppHeroTheme
  icon: 'whatsapp' | 'instagram' | 'youtube' | 'form' | 'telegram' | 'bio'
  defaultIcon?: IconName
}
```

### Presets (cores atuais — pensadas para fundo escuro)

**WhatsApp** (referência visual do usuário):
- `iconColor` / `ctaBg`: `#25D366`
- `ctaText`: `#000000`
- `badgeText`: `#7AE3A8`
- `gradient`: verde translúcido → verde-água → painel escuro `rgba(15,32,28,0.6)`
- `border` / glow / pulse: verdes com alpha

**YouTube:** vermelho `#FF0000`, `ctaText` branco, gradient vermelho → painel escuro.

**Instagram:** rosa/roxo, CTA em `linear-gradient(135deg, #833AB4, #E1306C, #F77737)`, texto branco.

**Formulário:** azul `#3B82F6`, texto CTA branco.

**Telegram:** `#2AABEE`, texto CTA branco.

**Personalizado (`custom`):** já usa CSS vars:
- `ctaBg: var(--color-primary)`
- `ctaText: var(--color-background)`
- demais via `color-mix(in oklch, var(--color-primary) …)`

Código completo atual de `APP_HERO_PRESETS`:

```ts
export const APP_HERO_PRESETS: Record<AppHeroPreset, AppHeroPresetConfig> = {
  whatsapp: {
    label: 'WhatsApp',
    defaults: {
      badge: 'Comunidade',
      title: 'Entre na comunidade',
      description: 'Grupo exclusivo com avisos, conteúdos e interação em tempo real.',
      cta: 'Entrar agora',
      url: 'https://wa.me/',
    },
    theme: {
      border: 'rgba(37,211,102,0.4)',
      borderHover: 'rgba(37,211,102,0.7)',
      gradient:
        'linear-gradient(135deg, rgba(37,211,102,0.22) 0%, rgba(18,140,126,0.18) 55%, rgba(15,32,28,0.6) 100%)',
      glow: 'rgba(37,211,102,0.35)',
      badgeText: '#7AE3A8',
      iconBg: 'rgba(37,211,102,0.25)',
      iconRing: 'rgba(37,211,102,0.45)',
      iconColor: '#25D366',
      pulseBorder: 'rgba(37,211,102,0.6)',
      ctaBg: '#25D366',
      ctaText: '#000000',
      ctaShadow: '0 10px 30px -10px rgba(37,211,102,0.7)',
    },
    icon: 'whatsapp',
  },
  youtube: {
    label: 'YouTube',
    defaults: { /* … */ },
    theme: {
      border: 'rgba(255,0,0,0.35)',
      borderHover: 'rgba(255,0,0,0.6)',
      gradient:
        'linear-gradient(135deg, rgba(255,0,0,0.2) 0%, rgba(180,0,0,0.15) 55%, rgba(20,10,10,0.65) 100%)',
      glow: 'rgba(255,0,0,0.3)',
      badgeText: '#FF8A8A',
      iconBg: 'rgba(255,0,0,0.2)',
      iconRing: 'rgba(255,0,0,0.4)',
      iconColor: '#FF0000',
      pulseBorder: 'rgba(255,0,0,0.55)',
      ctaBg: '#FF0000',
      ctaText: '#FFFFFF',
      ctaShadow: '0 10px 30px -10px rgba(255,0,0,0.55)',
    },
    icon: 'youtube',
  },
  instagram: {
    label: 'Instagram',
    theme: {
      border: 'rgba(225,48,108,0.4)',
      gradient:
        'linear-gradient(135deg, rgba(131,58,180,0.25) 0%, rgba(225,48,108,0.18) 50%, rgba(247,119,55,0.12) 100%)',
      badgeText: '#F9A8D4',
      iconColor: '#E1306C',
      ctaBg: 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)',
      ctaText: '#FFFFFF',
      // … ver arquivo completo no repo
    },
    icon: 'instagram',
  },
  form: { /* azul #3B82F6 — ver arquivo */ },
  telegram: { /* #2AABEE — ver arquivo */ },
  custom: {
    label: 'Personalizado',
    theme: {
      border: 'color-mix(in oklch, var(--color-primary) 40%, transparent)',
      gradient:
        'linear-gradient(135deg, color-mix(in oklch, var(--color-primary) 22%, transparent) 0%, color-mix(in oklch, var(--color-primary) 12%, transparent) 55%, rgba(15,20,30,0.65) 100%)',
      badgeText: 'var(--color-primary)',
      iconColor: 'var(--color-primary)',
      ctaBg: 'var(--color-primary)',
      ctaText: 'var(--color-background)',
      // …
    },
    icon: 'bio',
    defaultIcon: 'sparkles',
  },
}
```

> **Instrução:** leia o arquivo real `bio/src/lib/appHeroPresets.ts` no repo — é a fonte da verdade. O trecho acima resume o modelo.

---

## Modelo atual — componente (`AppHeroCard.tsx`)

### Comportamento

- Item: `AppHero | WhatsAppHero` (`whatsapp-hero` força preset `whatsapp`).
- Layouts: `default` | `compact` | `condensed` (grade força compact).
- Align: `side` (ícone ao lado, `items-center`) | `center` (coluna centralizada).
- Ícone: presets de marca sempre mostram ícone; `custom` sem `icon` **não** renderiza o box.
- Theme hoje: `const theme = APP_HERO_PRESETS[preset].theme` — **sem adaptação ao fundo da página**.

### Estrutura visual (layout `default` — o da imagem WhatsApp)

1. `HeroShell` → `CardLink` com `borderColor: theme.border`
2. Painel com `background: theme.gradient` + blob `theme.glow`
3. `HeroIconBox` (pulse + `iconBg` / `iconColor`)
4. Badge → `theme.badgeText`
5. Título → **`text-white` (fixo)**
6. Descrição → **`text-white/85` (fixo)**
7. CTA pill → `theme.ctaBg` / `theme.ctaText` / `theme.ctaShadow` + `ArrowIcon`

### Código atual completo do componente

```tsx
// bio/src/components/AppHeroCard.tsx — estado atual a preservar em estrutura/API

import type { ReactNode } from 'react'
import type { AppHero, AppHeroPreset, FeatureCardAlign, WhatsAppHero } from '../types/bio'
import { CardLink, hasClickableUrl } from '../lib/cardLink'
import { APP_HERO_PRESETS } from '../lib/appHeroPresets'
import { ArrowIcon, BioIcon, InstagramIcon, TelegramIcon, WhatsAppIcon, YouTubeIcon } from './icons'

type AppHeroLike = AppHero | WhatsAppHero

function resolvePreset(item: AppHeroLike): AppHeroPreset {
  if (item.type === 'whatsapp-hero') return 'whatsapp'
  return item.preset
}

function resolveLayout(item: AppHeroLike, grid: boolean) {
  if (item.layout === 'condensed') return 'condensed'
  if (grid || item.layout === 'compact') return 'compact'
  return item.layout ?? 'default'
}

function resolveAlign(item: AppHeroLike): FeatureCardAlign {
  return item.align === 'center' ? 'center' : 'side'
}

/** Personalizado sem ícone → não reserva espaço do ícone. Presets de marca mantêm o ícone. */
function resolveShowIcon(item: AppHeroLike, preset: AppHeroPreset): boolean {
  if (preset !== 'custom') return true
  return item.type === 'app-hero' && Boolean(item.icon)
}

function AppHeroIcon({ preset, icon, color, className }: {
  preset: AppHeroPreset
  icon?: AppHero['icon']
  color: string
  className?: string
}) {
  const config = APP_HERO_PRESETS[preset]
  const inner = (() => {
    switch (config.icon) {
      case 'whatsapp': return <WhatsAppIcon className={className} />
      case 'instagram': return <InstagramIcon className={className} />
      case 'youtube': return <YouTubeIcon className={className} />
      case 'telegram': return <TelegramIcon className={className} />
      case 'form': return <BioIcon name="form" className={className} />
      default:
        if (!icon) return null
        return <BioIcon name={icon} className={className} />
    }
  })()
  if (!inner) return null
  return <span style={{ color }}>{inner}</span>
}

function HeroIconBox({ preset, icon, theme, size = 'md' }: {
  preset: AppHeroPreset
  icon?: AppHero['icon']
  theme: (typeof APP_HERO_PRESETS)[AppHeroPreset]['theme']
  size?: 'md' | 'sm' | 'xs'
}) {
  const box =
    size === 'xs' ? 'h-9 w-9 rounded-lg'
    : size === 'sm' ? 'h-10 w-10 rounded-xl'
    : 'h-14 w-14 rounded-2xl'
  const iconSize = size === 'xs' ? 'h-4 w-4' : size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'

  if (size === 'md') {
    return (
      <div className="relative shrink-0">
        <span aria-hidden="true" className="absolute inset-0 rounded-2xl" style={{
          border: `1px solid ${theme.pulseBorder}`,
          animation: 'bio-pulse 2.4s ease-out infinite',
        }} />
        <div className={`flex ${box} items-center justify-center ring-1`} style={{
          background: theme.iconBg,
          boxShadow: `inset 0 0 0 1px ${theme.iconRing}`,
        }}>
          <AppHeroIcon preset={preset} icon={icon} color={theme.iconColor} className={iconSize} />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex shrink-0 ${box} items-center justify-center ring-1`} style={{
      background: theme.iconBg,
      boxShadow: `inset 0 0 0 1px ${theme.iconRing}`,
    }}>
      <AppHeroIcon preset={preset} icon={icon} color={theme.iconColor} className={iconSize} />
    </div>
  )
}

function HeroShell({ item, theme, children, className = '' }: {
  item: AppHeroLike
  theme: (typeof APP_HERO_PRESETS)[AppHeroPreset]['theme']
  children: ReactNode
  className?: string
}) {
  const clickable = hasClickableUrl(item.url)
  return (
    <CardLink
      url={item.url}
      className={`bio-card bio-card--hero bio-card--media group relative block overflow-hidden border transition-all ${className} ${clickable ? '' : 'cursor-default'}`}
      style={{ borderColor: theme.border }}
      onMouseEnter={(e) => { if (!clickable) return; e.currentTarget.style.borderColor = theme.borderHover }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border }}
    >
      {children}
    </CardLink>
  )
}

function HeroDefault({ item, preset, theme, icon, showIcon, align }: {
  item: AppHeroLike
  preset: AppHeroPreset
  theme: (typeof APP_HERO_PRESETS)[AppHeroPreset]['theme']
  icon?: AppHero['icon']
  showIcon: boolean
  align: FeatureCardAlign
}) {
  const centered = align === 'center'
  return (
    <HeroShell item={item} theme={theme}>
      <div className="relative p-5 sm:p-6" style={{ background: theme.gradient }}>
        <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
          style={{ background: theme.glow, animation: 'bio-glow 4s ease-in-out infinite' }} />
        <div className={centered
          ? 'relative z-10 flex flex-col items-center text-center'
          : 'relative z-10 flex items-center gap-4'}>
          {showIcon && (
            <div className={centered ? 'mb-3' : ''}>
              <HeroIconBox preset={preset} icon={icon} theme={theme} size="md" />
            </div>
          )}
          <div className={`min-w-0 ${centered ? 'w-full' : 'flex-1'}`}>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.badgeText }}>{item.badge}</span>
            {/* ATOS FIXOS — precisam virar dinâmicos no contraste */}
            <h3 className="mt-1 text-xl font-bold leading-tight text-white">{item.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/85 sm:text-sm">{item.description}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all group-hover:gap-2.5"
              style={{ background: theme.ctaBg, color: theme.ctaText, boxShadow: theme.ctaShadow }}>
              {item.cta}
              <ArrowIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </HeroShell>
  )
}

// HeroCompact / HeroCondensed: mesmo padrão — gradient do theme,
// título text-white, CTA com ctaBg/ctaText. Ver arquivo completo no repo.

export function AppHeroCard({ item, grid = false }: { item: AppHeroLike; grid?: boolean }) {
  const preset = resolvePreset(item)
  const theme = APP_HERO_PRESETS[preset].theme // ← ponto de injeção do theme adaptado
  const customIcon = item.type === 'app-hero' ? item.icon : undefined
  const layout = resolveLayout(item, grid)
  const align = resolveAlign(item)
  const showIcon = resolveShowIcon(item, preset)
  const props = { item, preset, theme, icon: customIcon, showIcon, align }
  switch (layout) {
    case 'compact': return <HeroCompact {...props} />
    case 'condensed': return <HeroCondensed {...props} />
    default: return <HeroDefault {...props} />
  }
}
```

> **Leia o arquivo completo** `bio/src/components/AppHeroCard.tsx` no disco — inclui `HeroCompact` e `HeroCondensed` por inteiro.

### Campos do item (types)

```ts
// bio/src/types/bio.ts (resumo)
export type AppHeroPreset = 'whatsapp' | 'youtube' | 'instagram' | 'form' | 'telegram' | 'custom'
export type AppHeroLayout = 'default' | 'compact' | 'condensed'
export type FeatureCardAlign = 'side' | 'center'

export interface AppHero {
  type: 'app-hero'
  preset: AppHeroPreset
  badge: string
  title: string
  description: string
  cta: string
  url: string
  icon?: IconName
  layout?: AppHeroLayout
  align?: FeatureCardAlign
}
```

---

## Utilitário de contraste existente (`contrastColor.ts`)

Usado hoje para **links/pill da primária da bio**, não para app-hero. Pode ser estendido ou espelhado:

```ts
export interface PrimarySurfaceColors {
  solidFrom: string
  solidTo: string
  fillPrimary: string
}

// Helpers internos: parseOklchLightness, estimateRelativeLuminance (hex), resolveLightness

export function resolvePrimarySurfaceColors(primary: string): PrimarySurfaceColors {
  const lightness = resolveLightness(primary)
  if (lightness > 0.66) {
    return {
      solidFrom: `color-mix(in oklch, ${primary} 70%, black)`,
      solidTo: `color-mix(in oklch, ${primary} 40%, black)`,
      fillPrimary: `color-mix(in oklch, ${primary} 62%, black)`,
    }
  }
  if (lightness > 0.58) { /* mix mais suave */ }
  return { solidFrom: `…`, solidTo: `…`, fillPrimary: primary }
}
```

`BioPage` define `--color-primary`, `--color-background` (quando há fundo sólido/preset), etc.

---

## Requisitos de produto

1. **Identidade preservada** — WhatsApp verde, YouTube vermelho, etc. CTA não vira cinza genérico.
2. **Contraste legível** — título/descrição/badge/CTA; se CTA ≈ fundo da página, diferenciar com ring/borda/`color-mix` mantendo matiz.
3. **Estratégias ok:** glass/gradient do card; `ctaText` P/B; ring no CTA; texto do card claro/escuro conforme painel; ícone mantém cor de marca.
4. **Não fazer:** config nova no editor; quebrar layouts/align/showIcon; mexer em update PHP; dependência pesada.

---

## Direção técnica sugerida

1. Resolver fundo efetivo da bio (preset edge / `background` / fallback escuro se só houver imagem).
2. `resolveAppHeroTheme(baseTheme, pageBackground): AppHeroTheme & { titleText?, bodyText? }` (ou estender `AppHeroTheme` com `titleText` / `bodyText` / `ctaRing?`).
3. Em `AppHeroCard`, usar o theme resolvido; **remover `text-white` fixo**.
4. Fundo preto ≈ visual atual.

---

## Critérios de aceite

- [ ] Fundo preto: cara atual preservada.
- [ ] Fundo claro / colorido: legível; CTA de marca reconhecível e distinto.
- [ ] Layouts + align + sem ícone (custom) intactos.
- [ ] Build bio/editor ok; sem opção nova no editor.

---

## Prompt curto (colar no Claude)

```
Implemente contraste adaptativo nos cards de destaque do monorepo insta-bio.

Leia e siga TODO o arquivo:
docs/docs_claude/INSTRUCOES-CONTRASTE-APP-HERO.md

Ele contém o modelo atual de AppHeroTheme, AppHeroCard (incluindo text-white
fixo), presets e contrastColor.ts.

Problema: themes em appHeroPresets.ts e text-white no JSX foram feitos para
fundo preto; em outros fundos da bio o card fica ilegível ou o CTA some.

Objetivo: adaptar theme automaticamente SEM perder identidade (WhatsApp
#25D366 etc.). Ponto de injeção: onde AppHeroCard faz
theme = APP_HERO_PRESETS[preset].theme

Não quebrar layouts/align/showIcon; não nova config no editor; não PHP.
```
