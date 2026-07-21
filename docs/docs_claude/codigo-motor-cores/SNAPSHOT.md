# Snapshot — motor de cores (código atual)

Gerado para alimentar Claude/DeepSeek junto com `PROMPT-MOTOR-CORES.md`.
Não edite à mão — regenere se o código mudar.


## `bio/src/types/bio.ts`

```ts
export type IconName =
  | 'whatsapp'
  | 'compass'
  | 'droplets'
  | 'map-pin'
  | 'heart'
  | 'gift'
  | 'hand-heart'
  | 'sparkles'
  | 'zap'
  | 'baby'
  | 'users'
  | 'calendar'
  | 'form'
  | 'youtube'
  | 'pray'
  | 'coffee'
  | 'message'
  | 'star'
  | 'phone'
  | 'mail'
  | 'globe'
  | 'link'
  | 'music'
  | 'mic'
  | 'book'
  | 'camera'
  | 'home'
  | 'share'
  | 'headphones'
  | 'sun'
  | 'moon'
  | 'church'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'telegram'
  | 'spotify'
  | 'cart'
  | 'store'
  | 'card'
  | 'tag'
  | 'percent'
  | 'briefcase'
  | 'clock'
  | 'ticket'
  | 'video'
  | 'image'
  | 'check'
  | 'info'
  | 'bell'
  | 'bookmark'
  | 'thumbs-up'
  | 'flame'
  | 'leaf'
  | 'utensils'
  | 'car'
  | 'building'
  | 'graduation'
  | 'wallet'
  | 'download'
  | 'external'
  | 'megaphone'
  | 'newspaper'
  | 'palette'
  | 'scissors'
  | 'shirt'
  | 'dumbbell'
  | 'plane'
  | 'cake'
  | 'party'
  | 'smile'
  | 'lock'
  | 'send'
  | 'file'
  | 'handshake'
  | 'cross'

export type CardWidth = 'full' | 'half'

export type SocialNetwork =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'email'
  | 'whatsapp'
  | 'spotify'

export interface SocialLink {
  network: SocialNetwork
  url: string
}

export type BioTemplate = 'classic' | 'pill' | 'outline' | 'solid' | 'glass' | 'soft'

export interface BioBrand {
  name: string
  tagline?: string
  location: string
  instagram: {
    handle: string
    url: string
  }
  /** Ícones de redes no topo da bio (opcional). */
  socialLinks?: SocialLink[]
  logo: string
  coverImage?: string
  template?: BioTemplate
  theme: {
    primary: string
    secondary?: string
    glow?: string
    background?: string
    backgroundImage?: string
    /** ID de gradiente pronto (ver backgroundPresets.ts) */
    backgroundPreset?: string
    /** 0 = cantos retos, 100 = máximo arredondamento (32px) */
    cardRadius?: number
  }
  seo: {
    title: string
    description: string
  }
  footer: string
}

export type AppHeroPreset = 'whatsapp' | 'youtube' | 'instagram' | 'form' | 'telegram' | 'custom'

export type AppHeroLayout = 'default' | 'compact' | 'condensed'

/** Alinhamento do conteúdo (ícone ao lado vs centralizado). */
export type FeatureCardAlign = 'side' | 'center'

export interface WhatsAppHero {
  type: 'whatsapp-hero'
  badge: string
  title: string
  description: string
  cta: string
  url: string
  layout?: AppHeroLayout
  align?: FeatureCardAlign
}

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

export interface FeatureCard {
  type: 'feature'
  badge?: string
  title: string
  description?: string
  cta?: string
  url: string
  variant?: 'gradient' | 'compact' | 'portrait' | 'banner' | 'square'
  /**
   * Só no formato gradiente:
   * - side: ícone ao lado do texto (padrão)
   * - center: ícone acima, conteúdo centralizado
   */
  align?: FeatureCardAlign
  icon?: IconName
  image?: string
  gradient?: string
  tags?: Array<{ label: string; icon?: IconName }>
  /** Metade da largura — 2 cards por linha (fora da grade da seção). */
  width?: CardWidth
}

export interface LinkCard {
  type: 'link'
  title: string
  subtitle?: string
  url: string
  icon?: IconName
  width?: CardWidth
}

export interface GridCard {
  type: 'grid'
  badge?: string
  title: string
  subtitle?: string
  url: string
  image?: string
  gradient?: string
  width?: CardWidth
}

export interface InstagramCard {
  type: 'instagram'
  name: string
  category: string
  handle: string
  url: string
  gradient: string
  icon?: IconName
}

export interface LocationCard {
  type: 'location'
  title: string
  address: string
  mapUrl: string
}

import type { MediaCardVariant } from '../lib/mediaCardLayout'

export type { MediaCardVariant } from '../lib/mediaCardLayout'

export interface SlideStoryItem {
  image?: string
  video?: string
  poster?: string
  /** Duração em segundos para imagens (padrão 5). Vídeos usam a duração do arquivo. */
  duration?: number
  url?: string
  caption?: string
}

export interface SlideCard {
  type: 'slide'
  title?: string
  variant?: MediaCardVariant
  slides: SlideStoryItem[]
  autoplay?: boolean
}

/** @deprecated use variant — mantido para bios antigas */
export type VideoAspectRatio = 'reel' | 'portrait' | 'square'

export interface VideoCard {
  type: 'video'
  title?: string
  description?: string
  video: string
  poster?: string
  url?: string
  variant?: MediaCardVariant
  width?: CardWidth
  /** @deprecated use variant */
  aspectRatio?: VideoAspectRatio
}

export interface ProductItem {
  image: string
  title?: string
  url?: string
  cta?: string
}

export interface ProductsCard {
  type: 'products'
  title?: string
  products: ProductItem[]
}

export interface YoutubeEmbedCard {
  type: 'youtube-embed'
  title?: string
  url: string
}

export type SpotifyEmbedTheme = 'dark' | 'light'

export interface SpotifyEmbedCard {
  type: 'spotify-embed'
  title?: string
  /** Código iframe exportado pelo Spotify ou URL de embed. */
  embed?: string
  /** @deprecated Use `embed`. Mantido para bios antigas. */
  url?: string
  /** @deprecated O tema vem no iframe exportado pelo Spotify. */
  theme?: SpotifyEmbedTheme
  /** @deprecated legado */
  size?: 'compact' | 'default'
}

export interface BioSection {
  id: string
  title: string
  subtitle?: string
  items: SectionItem[]
  layout?: 'stack' | 'grid-2' | 'instagram-grid'
}

export type SectionItem =
  | WhatsAppHero
  | AppHero
  | FeatureCard
  | LinkCard
  | GridCard
  | InstagramCard
  | LocationCard
  | VideoCard
  | SlideCard
  | ProductsCard
  | YoutubeEmbedCard
  | SpotifyEmbedCard

export interface BioConfig {
  brand: BioBrand
  sections: BioSection[]
}

```

## `bio/src/lib/contrastColor.ts`

```ts
export interface PrimarySurfaceColors {
  /** Gradiente solid — início (mais claro) */
  solidFrom: string
  /** Gradiente solid — fim (mais escuro) */
  solidTo: string
  /** Fill único para pill e similares */
  fillPrimary: string
}

function parseOklchLightness(color: string): number | null {
  const match = color.trim().match(/oklch\(\s*([\d.]+%?)/i)
  if (!match) return null
  const raw = match[1]
  return raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw)
}

function estimateRelativeLuminance(color: string): number {
  const trimmed = color.trim()
  const hexMatch = trimmed.match(/^#([0-9a-f]{3,8})$/i)
  if (hexMatch) {
    let hex = hexMatch[1]
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255
    const linear = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  }
  return 0.35
}

function resolveLightness(color: string): number {
  return parseOklchLightness(color) ?? estimateRelativeLuminance(color)
}

/**
 * Ajusta superfícies preenchidas com a primária para manter texto branco legível
 * sem inverter para preto — escurece o gradiente quando a primária é clara.
 */
export function resolvePrimarySurfaceColors(primary: string): PrimarySurfaceColors {
  const lightness = resolveLightness(primary)

  if (lightness > 0.66) {
    return {
      solidFrom: `color-mix(in oklch, ${primary} 70%, black)`,
      solidTo: `color-mix(in oklch, ${primary} 40%, black)`,
      fillPrimary: `color-mix(in oklch, ${primary} 62%, black)`,
    }
  }

  if (lightness > 0.58) {
    return {
      solidFrom: `color-mix(in oklch, ${primary} 80%, black)`,
      solidTo: `color-mix(in oklch, ${primary} 55%, black)`,
      fillPrimary: `color-mix(in oklch, ${primary} 72%, black)`,
    }
  }

  return {
    solidFrom: `color-mix(in oklch, ${primary} 92%, white)`,
    solidTo: `color-mix(in oklch, ${primary} 78%, black)`,
    fillPrimary: primary,
  }
}

```

## `bio/src/lib/appHeroContrast.ts`

```ts
// bio/src/lib/appHeroContrast.ts
//
// Contraste adaptativo para os cards de destaque (AppHeroCard: WhatsApp,
// YouTube, Instagram, Telegram, formulário, personalizado).
//
// Ponto de injeção (em bio/src/components/AppHeroCard.tsx):
//   const theme = APP_HERO_PRESETS[preset].theme
// vira:
//   const theme = resolveAppHeroTheme(APP_HERO_PRESETS[preset].theme, pageBackground)
//
// O que esta função faz:
//  - Nunca troca `iconColor` (identidade de marca).
//  - Escurece o `gradient` do card com um scrim (camada extra de background)
//    SÓ quando o painel resultante (gradient composto sobre o fundo da
//    página) ficaria claro — em fundo preto (caso de hoje) o gradient não
//    muda em nada.
//  - Devolve `titleText` / `bodyText`: cores calculadas para SUBSTITUIR os
//    `text-white` / `text-white/85` fixos no JSX do AppHeroCard.
//  - Escurece levemente `border` / `borderHover` / `glow` / `pulseBorder`
//    quando a PÁGINA (não só o painel) é clara — evita o efeito "sujo".
//  - Só mexe em `ctaBg` (leve reforço, preservando matiz) e agrega um anel
//    ao `ctaShadow` quando o contraste do CTA contra o painel final está
//    baixo. Presets com cor de token (`var(--color-primary)`, caso do preset
//    `custom`) não são reforçados — já resolvem contraste pelo tema do editor.
//
// Autocontido (sem libs novas), pensado para colar direto no monorepo.

import type { AppHeroTheme } from "./appHeroPresets";

export interface ResolvedAppHeroTheme extends AppHeroTheme {
  /** Cor do título — substitui a classe fixa `text-white` no JSX. */
  titleText: string;
  /** Cor da descrição — substitui a classe fixa `text-white/85` no JSX. */
  bodyText: string;
}

// ---------------------------------------------------------------------------
// Parsing e luminância
// (dedupe: se contrastColor.ts já tiver parseColor/luminância equivalentes,
// prefira importar de lá e apagar esta seção.)
// ---------------------------------------------------------------------------

interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/** Parse de hex (#fff, #ffffff, #ffffffcc) e rgb()/rgba(). */
export function parseColor(input: string | undefined | null): Rgb | null {
  if (!input) return null;
  const value = input.trim();

  const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const rgbMatch = value.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i
  );
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] !== undefined ? Number(rgbMatch[4]) : 1,
    };
  }

  const named: Record<string, Rgb> = {
    black: { r: 0, g: 0, b: 0, a: 1 },
    white: { r: 255, g: 255, b: 255, a: 1 },
  };
  if (named[value.toLowerCase()]) return named[value.toLowerCase()];

  return null;
}

/** Luminância relativa (WCAG 2.x). 0 = preto, 1 = branco. */
export function relativeLuminance(rgb: Rgb): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

/** Razão de contraste WCAG entre duas luminâncias (sempre >= 1). */
export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Composita `fg` (com alpha) sobre `bg` (opaco) e devolve o RGB resultante. */
function compositeOver(fg: Rgb, bg: Rgb): Rgb {
  const a = clamp01(fg.a ?? 1);
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

/** Extrai tokens `rgba(...)`/`rgb(...)`/hex de dentro de uma string CSS maior (gradientes). */
function extractColorTokens(css: string | undefined): string[] {
  if (!css) return [];
  const rgba = css.match(/rgba?\([^)]+\)/gi) ?? [];
  const hex = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  return [...rgba, ...hex];
}

/** Color-stops parseáveis de um `gradient` (rgba/hex). */
function extractGradientColors(gradient: string | undefined): Rgb[] {
  return extractColorTokens(gradient)
    .map(parseColor)
    .filter((c): c is Rgb => Boolean(c));
}

/** Último color-stop parseável de um `gradient` (assumido ser o stop final ~100%). */
function extractGradientEndColor(gradient: string | undefined): Rgb | null {
  const tokens = extractGradientColors(gradient);
  return tokens.length > 0 ? tokens[tokens.length - 1] : null;
}

/**
 * Resolve RGB opaco do fundo da página. Aceita cor sólida ou gradiente
 * (média dos stops) — evita cair no fallback preto quando BioPage passa
 * o `gradient` de um backgroundPreset.
 */
function resolvePageRgb(pageBackground: string): Rgb {
  const direct = parseColor(pageBackground);
  if (direct) return { r: direct.r, g: direct.g, b: direct.b, a: 1 };

  const stops = extractGradientColors(pageBackground);
  if (stops.length === 0) return { r: 10, g: 10, b: 10, a: 1 };

  return {
    r: stops.reduce((sum, c) => sum + c.r, 0) / stops.length,
    g: stops.reduce((sum, c) => sum + c.g, 0) / stops.length,
    b: stops.reduce((sum, c) => sum + c.b, 0) / stops.length,
    a: 1,
  };
}

/**
 * Luminância do painel do card: usa o stop MAIS CLARO do gradient composto
 * sobre o fundo (pior caso para texto branco). Só olhar o stop final falha
 * porque os stops iniciais são translúcidos e deixam o fundo claro vazar —
 * exatamente o que o usuário vê no topo do card.
 */
function estimatePanelFromGradient(
  gradient: string | undefined,
  pageRgb: Rgb,
): { luminance: number; sample: Rgb } {
  const stops = extractGradientColors(gradient);
  if (stops.length === 0) {
    return { luminance: relativeLuminance(pageRgb), sample: pageRgb };
  }

  let maxLum = -1;
  let maxSample = pageRgb;
  for (const stop of stops) {
    const composed = compositeOver(stop, pageRgb);
    const lum = relativeLuminance(composed);
    if (lum > maxLum) {
      maxLum = lum;
      maxSample = composed;
    }
  }
  return { luminance: maxLum, sample: maxSample };
}

/** `true` para valores dinâmicos do tema do editor (`var(--color-primary)`, `color-mix(...)`). */
function isTokenColor(css: string | undefined): boolean {
  return typeof css === "string" && css.includes("var(");
}

/**
 * Luminância estimada de uma cor sólida ou de um gradiente com stops
 * literais (hex/rgba) — usa a MÉDIA dos stops encontrados (ex: CTA do
 * Instagram, que é um `linear-gradient` de 3 cores de marca).
 * Valores baseados em token (`var(...)`) caem no fallback, propositalmente,
 * já que não são estáticos.
 */
function estimateLuminance(css: string | undefined, fallback = 0.3): number {
  if (!css || isTokenColor(css)) return fallback;
  const direct = parseColor(css);
  if (direct) return relativeLuminance(direct);
  const tokens = extractColorTokens(css)
    .map(parseColor)
    .filter((c): c is Rgb => Boolean(c));
  if (tokens.length === 0) return fallback;
  return tokens.reduce((sum, c) => sum + relativeLuminance(c), 0) / tokens.length;
}

/** Escurece/clareia uma cor SÓLIDA mantendo a matiz, via CSS `color-mix()`. */
function mixTowards(color: string, towards: "black" | "white", amountPercent: number): string {
  const amount = Math.round(clamp01(amountPercent / 100) * 100);
  return `color-mix(in oklch, ${color} ${100 - amount}%, ${towards} ${amount}%)`;
}

/**
 * Escurece/clareia qualquer `background` CSS (cor sólida OU gradiente),
 * inclusive os que usam tokens do editor, empilhando uma camada extra de
 * `background` em vez de tentar misturar dentro do valor original. Isso é o
 * que dá a "estratégia do glass" pedida nas instruções: as cores de marca
 * originais continuam por baixo, só ficam mais escuras/claras por cima.
 */
function reinforceBackground(css: string, towards: "black" | "white", amount: number): string {
  const rgb = towards === "black" ? "0,0,0" : "255,255,255";
  const a = clamp01(amount / 100).toFixed(2);
  return `linear-gradient(rgba(${rgb},${a}), rgba(${rgb},${a})), ${css}`;
}

// ---------------------------------------------------------------------------
// Fundo efetivo da bio
// ---------------------------------------------------------------------------

export interface BioBackgroundInput {
  /** `brand.theme.background` — cor sólida ou gradiente CSS, se houver. */
  background?: string | null;
  /** Cor plana já resolvida do `backgroundPreset`, se existir esse mapeamento hoje. */
  backgroundPresetColor?: string | null;
  /** Existe imagem de capa configurada? */
  hasBackgroundImage?: boolean;
}

/**
 * Decide qual cor usar como "fundo efetivo" da bio para fins de contraste.
 *
 * Fallback documentado:
 * - `backgroundImage` presente → fundo tratado como IMPREVISÍVEL, cai para o
 *   comportamento de fundo ESCURO (o cenário para o qual os presets já foram
 *   desenhados). Evita sampling de imagem em runtime (custo de canvas/CORS),
 *   fora de escopo aqui.
 * - Senão: usa `background` (cor sólida/gradiente com stop parseável) ou,
 *   se não houver, `backgroundPresetColor`.
 * - Se nada for utilizável: assume preto (comportamento atual, sem regressão).
 */
export function resolveEffectiveBioBackground(input: BioBackgroundInput): string {
  if (input.hasBackgroundImage) return "#000000";
  if (input.background && (parseColor(input.background) || extractGradientEndColor(input.background))) {
    return input.background;
  }
  if (input.backgroundPresetColor && parseColor(input.backgroundPresetColor)) {
    return input.backgroundPresetColor;
  }
  return "#000000";
}

// ---------------------------------------------------------------------------
// Ajuste de tema
// ---------------------------------------------------------------------------

const LOW_CONTRAST_THRESHOLD = 1.8; // abaixo disso, CTA "some" no painel
const SCRIM_MIN = 0.35;
const SCRIM_MAX = 0.72;

/**
 * Calcula o theme final do AppHeroCard, adaptado ao fundo efetivo da bio.
 * Ver cabeçalho do arquivo para o resumo do que muda e do que nunca muda.
 */
export function resolveAppHeroTheme(
  baseTheme: AppHeroTheme,
  pageBackground: string
): ResolvedAppHeroTheme {
  const pageRgb = resolvePageRgb(pageBackground);
  const pageLuminance = relativeLuminance(pageRgb);
  const pageIsLight = pageLuminance > 0.55;

  // 1) Luminância efetiva do PAINEL: pior caso (stop mais claro composto sobre
  //    o fundo). Stops iniciais do AppHero são translúcidos — em fundo claro
  //    o topo do card fica lavado mesmo com stop final escuro.
  const panel = estimatePanelFromGradient(baseTheme.gradient, pageRgb);
  // Página clara também força scrim: o card precisa de base escura para o
  // texto branco dos presets (critério de aceite fundo creme).
  const panelIsLight = panel.luminance > 0.45 || pageIsLight;

  // 2) Painel/página clara → scrim escuro em cima do gradient original (as
  //    cores de marca continuam por baixo). Fundo escuro → não mexe.
  let gradient = baseTheme.gradient;
  let finalPanelLuminance = panel.luminance;
  if (panelIsLight) {
    const scrimAmount =
      Math.min(SCRIM_MAX, Math.max(SCRIM_MIN, Math.max(panel.luminance, pageLuminance) * 0.85)) *
      100;
    gradient = reinforceBackground(baseTheme.gradient, "black", scrimAmount);
    const scrimmed = compositeOver({ r: 0, g: 0, b: 0, a: scrimAmount / 100 }, panel.sample);
    finalPanelLuminance = relativeLuminance(scrimmed);
  }

  // 3) Texto do card — dinâmico, calculado a partir da luminância FINAL do
  //    painel. Isso é o que substitui o `text-white` / `text-white/85` fixos.
  const titleText = finalPanelLuminance > 0.5 ? "#0A0A0A" : "#FFFFFF";
  const bodyText =
    finalPanelLuminance > 0.5 ? "rgba(10,10,10,0.75)" : "rgba(255,255,255,0.85)";

  // 4) Borda/glow/pulse: translúcidos de marca ficam "sujos" sobre página
  //    clara (eles ficam contra a PÁGINA, não contra o painel escurecido).
  const border = pageIsLight ? mixTowards(baseTheme.border, "black", 20) : baseTheme.border;
  const borderHover = pageIsLight
    ? mixTowards(baseTheme.borderHover, "black", 20)
    : baseTheme.borderHover;
  const glow = pageIsLight ? mixTowards(baseTheme.glow, "black", 25) : baseTheme.glow;
  const pulseBorder = pageIsLight
    ? mixTowards(baseTheme.pulseBorder, "black", 20)
    : baseTheme.pulseBorder;

  // 5) CTA: mantém a cor de marca (e não mexe em nada se for token do editor,
  //    ex. preset `custom` com `var(--color-primary)`). Só reforça se o
  //    contraste contra o painel final estiver baixo.
  const ctaIsToken = isTokenColor(baseTheme.ctaBg);
  const ctaLum = estimateLuminance(baseTheme.ctaBg, 0.3);
  const ctaContrast = contrastRatio(ctaLum, finalPanelLuminance);
  const needsCtaHelp = !ctaIsToken && ctaContrast < LOW_CONTRAST_THRESHOLD;

  let ctaBg = baseTheme.ctaBg;
  let ctaText = baseTheme.ctaText;
  let ctaShadow = baseTheme.ctaShadow;

  if (needsCtaHelp) {
    const towards: "black" | "white" = ctaLum > 0.5 ? "black" : "white";
    const amount = ctaLum > 0.5 ? 12 : 10;
    ctaBg = reinforceBackground(baseTheme.ctaBg, towards, amount);
    const reinforcedLum =
      towards === "black"
        ? ctaLum * (1 - amount / 100)
        : ctaLum * (1 - amount / 100) + amount / 100;
    ctaText = reinforcedLum > 0.5 ? "#0A0A0A" : "#FFFFFF";
    const ring =
      ctaLum > 0.5 ? "0 0 0 1px rgba(0,0,0,0.35)" : "0 0 0 1px rgba(255,255,255,0.55)";
    ctaShadow = `${baseTheme.ctaShadow}, ${ring}`;
  }

  return {
    ...baseTheme,
    gradient,
    border,
    borderHover,
    glow,
    pulseBorder,
    ctaBg,
    ctaText,
    ctaShadow,
    titleText,
    bodyText,
  };
}

```

## `bio/src/lib/backgroundPresets.ts`

```ts
export interface BackgroundPreset {
  id: string
  name: string
  tag?: string
  /** Gradiente CSS full-page (radial, estilo spotlight) */
  gradient: string
  /** Cor das bordas — usada em --color-background para cards/overlay */
  edgeColor: string
  /** Acento principal — contraste sobre o fundo escuro do preset */
  primary: string
  secondary: string
  glow: string
}

/** Fundos prontos em gradiente radial (estilo spotlight central) */
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'ocean-glow',
    name: 'Oceano',
    tag: 'Azul',
    gradient:
      'radial-gradient(ellipse 90% 80% at 50% 38%, #2b7bff 0%, #1550b8 38%, #0a2860 72%, #050f22 100%)',
    edgeColor: 'oklch(0.11 0.045 260)',
    primary: 'oklch(0.78 0.14 85)',
    secondary: 'oklch(0.88 0.08 90)',
    glow: 'oklch(0.78 0.14 85 / 0.32)',
  },
  {
    id: 'cobalt-spot',
    name: 'Cobalto',
    tag: 'Azul escuro',
    gradient:
      'radial-gradient(ellipse 85% 75% at 50% 40%, #4f8cff 0%, #2457c5 35%, #102a5c 68%, #070f1f 100%)',
    edgeColor: 'oklch(0.1 0.04 265)',
    primary: 'oklch(0.72 0.15 230)',
    secondary: 'oklch(0.82 0.10 210)',
    glow: 'oklch(0.72 0.15 230 / 0.3)',
  },
  {
    id: 'violet-glow',
    name: 'Violeta',
    tag: 'Roxo',
    gradient:
      'radial-gradient(ellipse 88% 78% at 50% 36%, #9b6dff 0%, #6b3fd4 34%, #321a6e 70%, #12082a 100%)',
    edgeColor: 'oklch(0.11 0.05 290)',
    primary: 'oklch(0.76 0.16 320)',
    secondary: 'oklch(0.85 0.10 330)',
    glow: 'oklch(0.76 0.16 320 / 0.32)',
  },
  {
    id: 'magenta-dusk',
    name: 'Magenta',
    tag: 'Rosa',
    gradient:
      'radial-gradient(ellipse 86% 76% at 50% 40%, #f06cad 0%, #c23d82 32%, #6a1f4a 68%, #1a0812 100%)',
    edgeColor: 'oklch(0.12 0.04 350)',
    primary: 'oklch(0.74 0.14 350)',
    secondary: 'oklch(0.84 0.10 350)',
    glow: 'oklch(0.74 0.14 350 / 0.3)',
  },
  {
    id: 'emerald-glow',
    name: 'Esmeralda',
    tag: 'Verde',
    gradient:
      'radial-gradient(ellipse 88% 78% at 50% 38%, #3dd68c 0%, #1fa86a 34%, #0f5038 70%, #061912 100%)',
    edgeColor: 'oklch(0.11 0.04 155)',
    primary: 'oklch(0.74 0.14 155)',
    secondary: 'oklch(0.84 0.09 160)',
    glow: 'oklch(0.74 0.14 155 / 0.28)',
  },
  {
    id: 'amber-warm',
    name: 'Âmbar',
    tag: 'Quente',
    gradient:
      'radial-gradient(ellipse 86% 76% at 50% 40%, #ffb347 0%, #e8872a 32%, #8a4510 68%, #1a0e06 100%)',
    edgeColor: 'oklch(0.12 0.035 55)',
    primary: 'oklch(0.68 0.17 55)',
    secondary: 'oklch(0.82 0.10 70)',
    glow: 'oklch(0.68 0.17 55 / 0.28)',
  },
  {
    id: 'sunset-fire',
    name: 'Pôr do sol',
    tag: 'Laranja',
    gradient:
      'radial-gradient(ellipse 88% 80% at 50% 36%, #ff7a45 0%, #e04320 30%, #7a1a12 65%, #140806 100%)',
    edgeColor: 'oklch(0.11 0.04 35)',
    primary: 'oklch(0.72 0.16 35)',
    secondary: 'oklch(0.84 0.10 40)',
    glow: 'oklch(0.72 0.16 35 / 0.3)',
  },
  {
    id: 'slate-glow',
    name: 'Grafite',
    tag: 'Neutro',
    gradient:
      'radial-gradient(ellipse 85% 75% at 50% 42%, #6b7280 0%, #3f4654 38%, #1c212b 72%, #0a0c10 100%)',
    edgeColor: 'oklch(0.11 0.01 260)',
    primary: 'oklch(0.74 0.12 250)',
    secondary: 'oklch(0.84 0.06 255)',
    glow: 'oklch(0.74 0.12 250 / 0.28)',
  },
  {
    id: 'gold-church',
    name: 'Dourado',
    tag: 'Igreja',
    gradient:
      'radial-gradient(ellipse 86% 78% at 50% 38%, #e8c547 0%, #b8922a 34%, #5c4512 70%, #141008 100%)',
    edgeColor: 'oklch(0.11 0.025 85)',
    primary: 'oklch(0.74 0.14 85)',
    secondary: 'oklch(0.86 0.08 90)',
    glow: 'oklch(0.74 0.14 85 / 0.22)',
  },
  {
    id: 'teal-clinic',
    name: 'Teal',
    tag: 'Saúde',
    gradient:
      'radial-gradient(ellipse 88% 78% at 50% 40%, #2dd4bf 0%, #0d9488 34%, #0f4f4a 70%, #051412 100%)',
    edgeColor: 'oklch(0.11 0.04 180)',
    primary: 'oklch(0.72 0.14 175)',
    secondary: 'oklch(0.82 0.10 180)',
    glow: 'oklch(0.72 0.14 175 / 0.28)',
  },
]

export function resolveBackgroundPreset(id?: string): BackgroundPreset | undefined {
  if (!id) return undefined
  return BACKGROUND_PRESETS.find((preset) => preset.id === id)
}

```

## `bio/src/lib/appHeroPresets.ts`

```ts
import type { AppHero, AppHeroPreset, IconName } from '../types/bio'

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
    defaults: {
      badge: 'Canal',
      title: 'Assista nossos vídeos',
      description: 'Lives, pregações, tutoriais e conteúdos exclusivos no YouTube.',
      cta: 'Ver canal',
      url: 'https://youtube.com/',
    },
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
    defaults: {
      badge: 'Redes sociais',
      title: 'Siga no Instagram',
      description: 'Acompanhe novidades, bastidores e conteúdo do dia a dia.',
      cta: 'Ver perfil',
      url: 'https://instagram.com/',
    },
    theme: {
      border: 'rgba(225,48,108,0.4)',
      borderHover: 'rgba(225,48,108,0.65)',
      gradient:
        'linear-gradient(135deg, rgba(131,58,180,0.25) 0%, rgba(225,48,108,0.18) 50%, rgba(247,119,55,0.12) 100%)',
      glow: 'rgba(225,48,108,0.3)',
      badgeText: '#F9A8D4',
      iconBg: 'rgba(225,48,108,0.2)',
      iconRing: 'rgba(225,48,108,0.4)',
      iconColor: '#E1306C',
      pulseBorder: 'rgba(225,48,108,0.55)',
      ctaBg: 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)',
      ctaText: '#FFFFFF',
      ctaShadow: '0 10px 30px -10px rgba(225,48,108,0.5)',
    },
    icon: 'instagram',
  },
  form: {
    label: 'Formulário',
    defaults: {
      badge: 'Inscrição',
      title: 'Participe do evento',
      description: 'Preencha o formulário e garanta sua vaga em poucos minutos.',
      cta: 'Preencher formulário',
      url: 'https://',
    },
    theme: {
      border: 'rgba(59,130,246,0.35)',
      borderHover: 'rgba(59,130,246,0.6)',
      gradient:
        'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.15) 55%, rgba(15,23,42,0.65) 100%)',
      glow: 'rgba(59,130,246,0.3)',
      badgeText: '#93C5FD',
      iconBg: 'rgba(59,130,246,0.2)',
      iconRing: 'rgba(59,130,246,0.4)',
      iconColor: '#3B82F6',
      pulseBorder: 'rgba(59,130,246,0.55)',
      ctaBg: '#3B82F6',
      ctaText: '#FFFFFF',
      ctaShadow: '0 10px 30px -10px rgba(59,130,246,0.5)',
    },
    icon: 'form',
    defaultIcon: 'form',
  },
  telegram: {
    label: 'Telegram',
    defaults: {
      badge: 'Comunidade',
      title: 'Entre no grupo do Telegram',
      description: 'Receba avisos e participe da comunidade pelo Telegram.',
      cta: 'Entrar no grupo',
      url: 'https://t.me/',
    },
    theme: {
      border: 'rgba(42,171,238,0.35)',
      borderHover: 'rgba(42,171,238,0.6)',
      gradient:
        'linear-gradient(135deg, rgba(42,171,238,0.2) 0%, rgba(34,158,217,0.15) 55%, rgba(10,25,35,0.65) 100%)',
      glow: 'rgba(42,171,238,0.3)',
      badgeText: '#7DD3FC',
      iconBg: 'rgba(42,171,238,0.2)',
      iconRing: 'rgba(42,171,238,0.4)',
      iconColor: '#2AABEE',
      pulseBorder: 'rgba(42,171,238,0.55)',
      ctaBg: '#2AABEE',
      ctaText: '#FFFFFF',
      ctaShadow: '0 10px 30px -10px rgba(42,171,238,0.5)',
    },
    icon: 'telegram',
  },
  custom: {
    label: 'Personalizado',
    defaults: {
      badge: 'Destaque',
      title: 'Título do card',
      description: 'Descrição do destaque com link para qualquer serviço.',
      cta: 'Acessar',
      url: 'https://',
    },
    theme: {
      border: 'color-mix(in oklch, var(--color-primary) 40%, transparent)',
      borderHover: 'color-mix(in oklch, var(--color-primary) 65%, transparent)',
      gradient:
        'linear-gradient(135deg, color-mix(in oklch, var(--color-primary) 22%, transparent) 0%, color-mix(in oklch, var(--color-primary) 12%, transparent) 55%, rgba(15,20,30,0.65) 100%)',
      glow: 'color-mix(in oklch, var(--color-primary) 35%, transparent)',
      badgeText: 'var(--color-primary)',
      iconBg: 'color-mix(in oklch, var(--color-primary) 20%, transparent)',
      iconRing: 'color-mix(in oklch, var(--color-primary) 40%, transparent)',
      iconColor: 'var(--color-primary)',
      pulseBorder: 'color-mix(in oklch, var(--color-primary) 55%, transparent)',
      ctaBg: 'var(--color-primary)',
      ctaText: 'var(--color-background)',
      ctaShadow: '0 10px 30px -10px color-mix(in oklch, var(--color-primary) 55%, transparent)',
    },
    icon: 'bio',
    defaultIcon: 'sparkles',
  },
}

export const APP_HERO_PRESET_LIST = Object.entries(APP_HERO_PRESETS).map(([value, config]) => ({
  value: value as AppHeroPreset,
  label: config.label,
}))

export function createAppHero(preset: AppHeroPreset): AppHero {
  const config = APP_HERO_PRESETS[preset]
  return {
    type: 'app-hero',
    preset,
    ...config.defaults,
    ...(preset === 'custom' ? { icon: config.defaultIcon } : {}),
  }
}

export function appHeroFromWhatsApp(item: {
  badge: string
  title: string
  description: string
  cta: string
  url: string
}): AppHero {
  return { type: 'app-hero', preset: 'whatsapp', ...item }
}

```

## `bio/src/components/BioPage.tsx`

```tsx
import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import type { BioConfig } from '../types/bio'
import { resolveBackgroundPreset } from '../lib/backgroundPresets'
import { resolveEffectiveBioBackground } from '../lib/appHeroContrast'
import { resolvePrimarySurfaceColors } from '../lib/contrastColor'
import { resolveBioTemplate } from '../lib/templates'
import { resolveCardRadiusPx } from '../lib/cardRadius'
import { applyPageMeta } from '../lib/pageMeta'
import { resolvePublicUrl } from '../lib/publicUrl'
import { BioHeader } from './BioHeader'
import { BioSectionBlock } from './BioSection'

interface BioPageProps {
  config: BioConfig
  /** Destaque do card ativo no preview do editor (opcional). */
  previewFocus?: { sectionId: string; itemIndex: number } | null
}

export function BioPage({ config, previewFocus = null }: BioPageProps) {
  const { brand, sections } = config
  const template = resolveBioTemplate(brand.template)
  const bgPreset = resolveBackgroundPreset(brand.theme.backgroundPreset)
  const hasBgImage = Boolean(brand.theme.backgroundImage)
  const hasBgPreset = Boolean(bgPreset) && !hasBgImage
  const pageBackground = resolveEffectiveBioBackground({
    background: hasBgPreset && bgPreset ? bgPreset.gradient : brand.theme.background,
    backgroundPresetColor: bgPreset?.edgeColor,
    hasBackgroundImage: hasBgImage,
  })

  const primarySurface = resolvePrimarySurfaceColors(brand.theme.primary)

  const themeVars = {
    '--color-primary': brand.theme.primary,
    '--bio-solid-from': primarySurface.solidFrom,
    '--bio-solid-to': primarySurface.solidTo,
    '--bio-fill-primary': primarySurface.fillPrimary,
    '--bio-card-radius': resolveCardRadiusPx(brand.theme.cardRadius),
    ...(brand.theme.secondary ? { '--color-secondary': brand.theme.secondary } : {}),
    ...(!hasBgImage && (hasBgPreset ? bgPreset?.edgeColor : brand.theme.background)
      ? {
          '--color-background': hasBgPreset
            ? bgPreset!.edgeColor
            : brand.theme.background,
        }
      : {}),
  } as CSSProperties

  useEffect(() => {
    applyPageMeta(brand)
  }, [brand.logo, brand.name, brand.tagline])

  useEffect(() => {
    const root = document.documentElement
    const keys = Object.keys(themeVars) as Array<keyof typeof themeVars>

    keys.forEach((key) => {
      const value = themeVars[key]
      if (value != null && value !== '') {
        root.style.setProperty(key, String(value))
      }
    })
  }, [
    brand.theme.primary,
    brand.theme.secondary,
    brand.theme.background,
    brand.theme.cardRadius,
    brand.theme.backgroundPreset,
    brand.theme.backgroundImage,
    primarySurface.solidFrom,
    primarySurface.solidTo,
    primarySurface.fillPrimary,
  ])

  return (
    <div
      data-bio-template={template}
      className="relative isolate min-h-screen text-foreground"
      style={themeVars}
    >
      {!hasBgImage && !hasBgPreset && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-background" />
      )}

      {hasBgPreset && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: bgPreset!.gradient }}
        />
      )}

      {hasBgImage && (
        <div
          aria-hidden="true"
          className="bio-page-bg-image pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${resolvePublicUrl(brand.theme.backgroundImage!)})`,
          }}
        />
      )}

      {hasBgImage && (
        <div
          aria-hidden="true"
          className="bio-page-bg-overlay bio-page-bg-overlay--image pointer-events-none fixed inset-0 z-[1]"
        />
      )}

      {!hasBgImage && !hasBgPreset && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[1] h-[480px]"
          style={{
            background: `radial-gradient(60% 60% at 50% 0%, ${brand.theme.glow ?? brand.theme.primary}, transparent 70%)`,
          }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-md px-5 pb-16 pt-12 sm:max-w-lg sm:px-6 sm:pt-16">
        <BioHeader brand={brand} />

        {sections.map((section) => (
          <BioSectionBlock
            key={section.id}
            section={section}
            pageBackground={pageBackground}
            focusItemIndex={
              previewFocus?.sectionId === section.id ? previewFocus.itemIndex : null
            }
          />
        ))}

        <footer className="mt-10 text-center space-y-1.5">
          <p className="text-[11px] text-muted-foreground/70">{brand.footer}</p>
          <p className="text-[11px] text-muted-foreground/80">
            by{' '}
            <a
              href="https://linksnabio.app.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
            >
              linksnabio
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}

```

## `bio/src/components/AppHeroCard.tsx`

```tsx
import type { ReactNode } from 'react'
import type { AppHero, AppHeroPreset, FeatureCardAlign, WhatsAppHero } from '../types/bio'
import { CardLink, hasClickableUrl } from '../lib/cardLink'
import { APP_HERO_PRESETS } from '../lib/appHeroPresets'
import { resolveAppHeroTheme, type ResolvedAppHeroTheme } from '../lib/appHeroContrast'
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

function AppHeroIcon({
  preset,
  icon,
  color,
  className,
}: {
  preset: AppHeroPreset
  icon?: AppHero['icon']
  color: string
  className?: string
}) {
  const config = APP_HERO_PRESETS[preset]

  const inner = (() => {
    switch (config.icon) {
      case 'whatsapp':
        return <WhatsAppIcon className={className} />
      case 'instagram':
        return <InstagramIcon className={className} />
      case 'youtube':
        return <YouTubeIcon className={className} />
      case 'telegram':
        return <TelegramIcon className={className} />
      case 'form':
        return <BioIcon name="form" className={className} />
      default:
        if (!icon) return null
        return <BioIcon name={icon} className={className} />
    }
  })()

  if (!inner) return null
  return <span style={{ color }}>{inner}</span>
}

function HeroIconBox({
  preset,
  icon,
  theme,
  size = 'md',
}: {
  preset: AppHeroPreset
  icon?: AppHero['icon']
  theme: ResolvedAppHeroTheme
  size?: 'md' | 'sm' | 'xs'
}) {
  const box =
    size === 'xs'
      ? 'h-9 w-9 rounded-lg'
      : size === 'sm'
        ? 'h-10 w-10 rounded-xl'
        : 'h-14 w-14 rounded-2xl'
  const iconSize = size === 'xs' ? 'h-4 w-4' : size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'

  if (size === 'md') {
    return (
      <div className="relative shrink-0">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl"
          style={{
            border: `1px solid ${theme.pulseBorder}`,
            animation: 'bio-pulse 2.4s ease-out infinite',
          }}
        />
        <div
          className={`flex ${box} items-center justify-center ring-1`}
          style={{
            background: theme.iconBg,
            boxShadow: `inset 0 0 0 1px ${theme.iconRing}`,
          }}
        >
          <AppHeroIcon preset={preset} icon={icon} color={theme.iconColor} className={iconSize} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex shrink-0 ${box} items-center justify-center ring-1`}
      style={{
        background: theme.iconBg,
        boxShadow: `inset 0 0 0 1px ${theme.iconRing}`,
      }}
    >
      <AppHeroIcon preset={preset} icon={icon} color={theme.iconColor} className={iconSize} />
    </div>
  )
}

function HeroShell({
  item,
  theme,
  children,
  className = '',
}: {
  item: AppHeroLike
  theme: ResolvedAppHeroTheme
  children: ReactNode
  className?: string
}) {
  const clickable = hasClickableUrl(item.url)

  return (
    <CardLink
      url={item.url}
      className={`bio-card bio-card--hero bio-card--media group relative block overflow-hidden border transition-all ${className} ${clickable ? '' : 'cursor-default'}`}
      style={{ borderColor: theme.border }}
      onMouseEnter={(e) => {
        if (!clickable) return
        e.currentTarget.style.borderColor = theme.borderHover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.border
      }}
    >
      {children}
    </CardLink>
  )
}

function HeroDefault({
  item,
  preset,
  theme,
  icon,
  showIcon,
  align,
}: {
  item: AppHeroLike
  preset: AppHeroPreset
  theme: ResolvedAppHeroTheme
  icon?: AppHero['icon']
  showIcon: boolean
  align: FeatureCardAlign
}) {
  const centered = align === 'center'

  return (
    <HeroShell item={item} theme={theme}>
      <div className="relative p-5 sm:p-6" style={{ background: theme.gradient }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
          style={{
            background: theme.glow,
            animation: 'bio-glow 4s ease-in-out infinite',
          }}
        />
        <div
          className={
            centered
              ? 'relative z-10 flex flex-col items-center text-center'
              : 'relative z-10 flex items-center gap-4'
          }
        >
          {showIcon && (
            <div className={centered ? 'mb-3' : ''}>
              <HeroIconBox preset={preset} icon={icon} theme={theme} size="md" />
            </div>
          )}
          <div className={`min-w-0 ${centered ? 'w-full' : 'flex-1'}`}>
            <span
              className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.badgeText }}
            >
              {item.badge}
            </span>
            <h3 className="mt-1 text-xl font-bold leading-tight" style={{ color: theme.titleText }}>
              {item.title}
            </h3>
            <p
              className="mt-1.5 text-xs leading-relaxed sm:text-sm"
              style={{ color: theme.bodyText }}
            >
              {item.description}
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all group-hover:gap-2.5"
              style={{
                background: theme.ctaBg,
                color: theme.ctaText,
                boxShadow: theme.ctaShadow,
              }}
            >
              {item.cta}
              <ArrowIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </HeroShell>
  )
}

function HeroCompact({
  item,
  preset,
  theme,
  icon,
  showIcon,
  align,
}: {
  item: AppHeroLike
  preset: AppHeroPreset
  theme: ResolvedAppHeroTheme
  icon?: AppHero['icon']
  showIcon: boolean
  align: FeatureCardAlign
}) {
  const centered = align === 'center'

  return (
    <HeroShell item={item} theme={theme} className="h-full">
      <div
        className={`relative flex h-full min-h-[132px] p-3.5 ${
          centered ? 'flex-col items-center text-center' : 'flex-row items-center gap-3'
        }`}
        style={{ background: theme.gradient }}
      >
        {showIcon && <HeroIconBox preset={preset} icon={icon} theme={theme} size="sm" />}
        <div
          className={`flex min-w-0 flex-1 flex-col ${centered ? 'mt-2 w-full items-center' : ''}`}
        >
          <h3
            className={`line-clamp-2 flex-1 text-sm font-bold leading-snug ${
              centered ? '' : ''
            }`}
            style={{ color: theme.titleText }}
          >
            {item.title}
          </h3>
          <span
            className={`mt-2 inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              centered ? '' : 'w-fit'
            }`}
            style={{
              background: theme.ctaBg,
              color: theme.ctaText,
              boxShadow: theme.ctaShadow,
            }}
          >
            <span className="truncate">{item.cta}</span>
            <ArrowIcon className="h-3 w-3 shrink-0" />
          </span>
        </div>
      </div>
    </HeroShell>
  )
}

function HeroCondensed({
  item,
  preset,
  theme,
  icon,
  showIcon,
  align,
}: {
  item: AppHeroLike
  preset: AppHeroPreset
  theme: ResolvedAppHeroTheme
  icon?: AppHero['icon']
  showIcon: boolean
  align: FeatureCardAlign
}) {
  const centered = align === 'center'

  return (
    <HeroShell item={item} theme={theme} className="h-full">
      <div
        className={`flex h-full min-h-[72px] p-3 ${
          centered
            ? 'flex-col items-center justify-center gap-1.5 text-center'
            : 'flex-row items-center gap-2.5'
        }`}
        style={{ background: theme.gradient }}
      >
        {showIcon && <HeroIconBox preset={preset} icon={icon} theme={theme} size="xs" />}
        <h3
          className={`min-w-0 text-xs font-bold leading-tight line-clamp-2 ${
            centered ? 'w-full' : 'flex-1'
          }`}
          style={{ color: theme.titleText }}
        >
          {item.title}
        </h3>
        {!centered && hasClickableUrl(item.url) && (
          <span style={{ color: theme.bodyText }}>
            <ArrowIcon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </HeroShell>
  )
}

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

  switch (layout) {
    case 'compact':
      return <HeroCompact {...props} />
    case 'condensed':
      return <HeroCondensed {...props} />
    default:
      return <HeroDefault {...props} />
  }
}

```

## `bio/src/components/FeatureCard.tsx`

```tsx
import type { ReactNode } from 'react'
import type { FeatureCard as FeatureCardType } from '../types/bio'
import { CardLink, hasClickableUrl } from '../lib/cardLink'
import { resolvePublicUrl } from '../lib/publicUrl'
import { ArrowIcon, BioIcon } from './icons'

function ImageOverlay() {
  return <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
}

function BadgePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/20">
      {children}
    </span>
  )
}

export function FeatureCard({ item, grid = false }: { item: FeatureCardType; grid?: boolean }) {
  const clickable = hasClickableUrl(item.url)
  const shellClass = `bio-card bio-card--media group relative block ${grid ? 'h-full' : ''}`

  if (item.variant === 'square') {
    return (
      <CardLink url={item.url} className={`${shellClass} aspect-square`}>
        {item.image ? (
          <>
            <img
              src={resolvePublicUrl(item.image)}
              alt={item.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                item.gradient ??
                'linear-gradient(135deg, oklch(0.70 0.18 55) 0%, oklch(0.55 0.19 40) 100%)',
            }}
          />
        )}

        {item.badge && (
          <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/20">
            {item.badge}
          </span>
        )}

        {clickable && (
          <ArrowIcon className="absolute right-2 top-2 h-4 w-4 text-white/90 drop-shadow" />
        )}

        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="text-base font-bold leading-tight text-white">{item.title}</h3>
          {item.description && <p className="mt-0.5 text-[10px] text-white/85">{item.description}</p>}
        </div>
      </CardLink>
    )
  }

  if (item.variant === 'portrait' && item.image) {
    return (
      <CardLink url={item.url} className={shellClass}>
        <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[3/4]">
          <img
            src={resolvePublicUrl(item.image)}
            alt={item.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
          <ImageOverlay />

          {item.tags && item.tags.length > 0 && (
            <div className="absolute left-3 top-3 inline-flex flex-wrap items-center gap-1.5">
              {item.tags.map((tag) => (
                <BadgePill key={tag.label}>
                  {tag.icon && <BioIcon name={tag.icon} className="mr-1 h-3 w-3" />}
                  {tag.label}
                </BadgePill>
              ))}
            </div>
          )}

          {item.badge && !(item.tags && item.tags.length > 0) && (
            <span className="absolute left-3 top-3">
              <BadgePill>{item.badge}</BadgePill>
            </span>
          )}

          {clickable && (
            <ArrowIcon className="absolute right-3 top-3 h-5 w-5 text-white/90 drop-shadow transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          )}

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            {item.badge && item.tags && item.tags.length > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.85_0.16_75)]">
                {item.badge}
              </span>
            )}
            <h3 className="text-xl font-bold leading-tight text-white sm:text-2xl">{item.title}</h3>
            <p className="mt-1 text-xs text-white/85 sm:text-sm">{item.description}</p>
          </div>
        </div>
      </CardLink>
    )
  }

  if (item.variant === 'banner' && item.image) {
    return (
      <CardLink url={item.url} className={shellClass}>
        <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
          <img
            src={resolvePublicUrl(item.image)}
            alt={item.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
          <div
            aria-hidden="true"
            className="absolute inset-0 mix-blend-soft-light"
            style={{
              background:
                'linear-gradient(135deg, oklch(0.78 0.16 80 / 0.55) 0%, transparent 55%)',
            }}
          />

          {item.tags && item.tags.length > 0 && (
            <div className="absolute left-3 top-3 inline-flex items-center gap-1.5">
              {item.tags.map((tag) => (
                <BadgePill key={tag.label}>
                  {tag.icon && <BioIcon name={tag.icon} className="mr-1 h-3 w-3" />}
                  {tag.label}
                </BadgePill>
              ))}
            </div>
          )}

          {clickable && (
            <ArrowIcon className="absolute right-3 top-3 h-5 w-5 text-white/90 drop-shadow transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          )}

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                {item.badge && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.85_0.16_75)]">
                    {item.badge}
                  </span>
                )}
                <h3 className="mt-1 text-xl font-bold leading-tight text-white sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-white/85 sm:text-sm">{item.description}</p>
              </div>
              {item.cta && (
                <span className="hidden shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black shadow-md sm:inline-flex">
                  {item.cta}
                </span>
              )}
            </div>
            {item.cta && (
              <span className="mt-3 inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black shadow-md sm:hidden">
                {item.cta}
              </span>
            )}
          </div>
        </div>
      </CardLink>
    )
  }

  if (item.variant === 'compact') {
    return (
      <CardLink url={item.url} className={`${shellClass} h-full`}>
        <div
          className="relative overflow-hidden p-4 sm:p-5"
          style={{
            background:
              'linear-gradient(135deg, oklch(0.22 0.04 25) 0%, oklch(0.14 0.03 25) 100%)',
          }}
        >
          <div className="relative flex items-center gap-3 sm:gap-4">
            {item.icon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF0000] shadow-[0_8px_24px_-6px_rgba(255,0,0,0.6)] ring-1 ring-white/10 sm:h-14 sm:w-[60px]">
                <BioIcon name={item.icon} className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {item.badge && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FF4D6A]">
                  {item.badge}
                </span>
              )}
              <h3 className="mt-0.5 text-base font-bold leading-tight text-white sm:text-lg">
                {item.title}
              </h3>
              <p className="mt-0.5 text-[11px] text-white/70 sm:text-xs">{item.description}</p>
            </div>
            {clickable && (
              <ArrowIcon className="h-5 w-5 shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            )}
          </div>
        </div>
      </CardLink>
    )
  }

  const centered = item.align === 'center'

  return (
    <CardLink url={item.url} className={shellClass}>
      <div
        className="relative p-5 sm:p-6"
        style={{
          background:
            item.gradient ??
            'linear-gradient(135deg, oklch(0.70 0.18 55) 0%, oklch(0.55 0.19 40) 100%)',
        }}
      >
        {clickable && (
          <ArrowIcon className="absolute right-3 top-3 h-5 w-5 text-white/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )}
        <div
          className={
            centered
              ? 'relative z-10 flex flex-col items-center text-center'
              : 'relative z-10 flex items-center gap-4'
          }
        >
          {item.icon && (
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm ${
                centered ? 'mb-3' : ''
              }`}
            >
              <BioIcon name={item.icon} className="h-7 w-7 text-white" />
            </div>
          )}
          <div className={`min-w-0 ${centered ? 'w-full' : 'flex-1'}`}>
            {item.badge && (
              <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90">
                {item.badge}
              </span>
            )}
            <h3 className="mt-1 text-xl font-bold leading-tight text-white sm:text-2xl">
              {item.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/85 sm:text-sm">
              {item.description}
            </p>
            {item.cta && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-black shadow-md">
                {item.cta}
              </span>
            )}
          </div>
        </div>
      </div>
    </CardLink>
  )
}

```

## `bio/src/components/GridCard.tsx`

```tsx
import type { GridCard as GridCardType } from '../types/bio'
import { CardLink, hasClickableUrl } from '../lib/cardLink'
import { resolvePublicUrl } from '../lib/publicUrl'
import { ArrowIcon } from './icons'

export function GridCard({ item }: { item: GridCardType }) {
  const clickable = hasClickableUrl(item.url)

  return (
    <CardLink
      url={item.url}
      className="bio-card bio-card--media group relative block aspect-square"
    >
      {item.image ? (
        <>
          <img
            src={resolvePublicUrl(item.image)}
            alt={item.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: item.gradient }} />
      )}

      {item.badge && (
        <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/20">
          {item.badge}
        </span>
      )}

      {clickable && (
        <ArrowIcon className="absolute right-2 top-2 h-4 w-4 text-white/90 drop-shadow" />
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="text-base font-bold leading-tight text-white">{item.title}</h3>
        {item.subtitle && <p className="mt-0.5 text-[10px] text-white/85">{item.subtitle}</p>}
      </div>
    </CardLink>
  )
}

```

## `bio/src/components/LinkCard.tsx`

```tsx
import type { LinkCard as LinkCardType } from '../types/bio'
import { CardLink, hasClickableUrl } from '../lib/cardLink'
import { ArrowIcon, BioIcon } from './icons'

export function LinkCard({ item, grid = false }: { item: LinkCardType; grid?: boolean }) {
  const clickable = hasClickableUrl(item.url)
  const hasIcon = Boolean(item.icon)

  if (grid) {
    return (
      <CardLink
        url={item.url}
        className="bio-card bio-link-card bio-link-card--grid group relative flex h-full flex-col p-3"
      >
        <div className="bio-link-body mb-3 flex items-center justify-between">
          {hasIcon ? (
            <div className="bio-link-icon-wrap flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <BioIcon name={item.icon} className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <span />
          )}
          {clickable && (
            <ArrowIcon className="bio-link-arrow h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          )}
        </div>
        <div className={`min-w-0 ${item.subtitle ? '' : 'mt-auto'}`}>
          <h3 className="bio-link-title text-sm font-bold leading-tight text-foreground">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="bio-link-subtitle bio-text-secondary mt-1 text-xs leading-snug">
              {item.subtitle}
            </p>
          )}
        </div>
      </CardLink>
    )
  }

  return (
    <CardLink url={item.url} className="bio-card bio-link-card group relative block">
      <div className="bio-link-body flex items-center gap-4 p-4">
        {hasIcon && (
          <div className="bio-link-icon-wrap flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <BioIcon name={item.icon} className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="bio-link-title text-base font-bold leading-tight text-foreground">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="bio-link-subtitle bio-text-secondary mt-0.5 text-xs">{item.subtitle}</p>
          )}
        </div>
        {clickable && (
          <ArrowIcon className="bio-link-arrow h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        )}
      </div>
    </CardLink>
  )
}

```

## `bio/src/components/BioSection.tsx`

```tsx
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import type { BioSection, SectionItem } from '../types/bio'
import { itemSpansFullInGrid, groupStackSectionItems } from '../lib/sectionLayout'
import { AppHeroCard } from './AppHeroCard'
import { FeatureCard } from './FeatureCard'
import { GridCard } from './GridCard'
import { LinkCard } from './LinkCard'
import { LocationCard } from './LocationCard'
import { ProductsCard } from './ProductsCard'
import { SlideCard } from './SlideCard'
import { SpotifyEmbedCard } from './SpotifyEmbedCard'
import { VideoCard } from './VideoCard'
import { YoutubeEmbedCard } from './YoutubeEmbedCard'

function isPreviewMode() {
  return typeof document !== 'undefined' && document.documentElement.dataset.bioPreview === '1'
}

function wrapPreviewItem({
  sectionId,
  index,
  className,
  style,
  children,
}: {
  sectionId: string
  index: number
  className: string
  style?: CSSProperties
  children: ReactNode
}) {
  const preview = isPreviewMode()

  function onClickCapture(event: MouseEvent) {
    if (!preview) return
    event.preventDefault()
    event.stopPropagation()
    window.parent.postMessage(
      { type: 'bio-preview-select', sectionId, itemIndex: index },
      '*',
    )
  }

  return (
    <div
      key={`${sectionId}:${index}`}
      data-preview-item={`${sectionId}:${index}`}
      className={`${className}${preview ? ' bio-preview-selectable' : ''}`}
      style={style}
      onClickCapture={preview ? onClickCapture : undefined}
    >
      {children}
    </div>
  )
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  if (!title) return null

  return (
    <div className="mb-3 mt-6 px-1">
      <h2 className="bio-section-title text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
        {title}
      </h2>
      {subtitle && <p className="bio-section-subtitle mt-1 text-xs">{subtitle}</p>}
    </div>
  )
}

function itemUsesGridLayout(item: SectionItem, sectionGrid: boolean): boolean {
  if (sectionGrid) return true
  if (item.type === 'link' || item.type === 'feature' || item.type === 'grid') {
    return item.width === 'half'
  }
  return false
}

function renderItem(
  item: SectionItem,
  index: number,
  grid: boolean,
  sectionId: string,
  focused: boolean,
  pageBackground: string,
) {
  const delay = { animationDelay: `${index * 60}ms` }
  const inGrid = itemUsesGridLayout(item, grid)
  const spanClass = grid && itemSpansFullInGrid(item) ? 'col-span-2' : ''
  const focusClass = focused ? 'bio-preview-focus' : ''
  const shell = `animate-fade-up ${spanClass} ${focusClass}`.trim()

  switch (item.type) {
    case 'whatsapp-hero':
    case 'app-hero':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `${shell} h-full`,
        style: delay,
        children: <AppHeroCard item={item} grid={grid} pageBackground={pageBackground} />,
      })
    case 'feature':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `${shell} h-full`,
        style: delay,
        children: <FeatureCard item={item} grid={inGrid} />,
      })
    case 'link':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `${shell} h-full`,
        style: delay,
        children: <LinkCard item={item} grid={inGrid} />,
      })
    case 'grid':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `${shell} h-full`,
        style: delay,
        children: <GridCard item={item} />,
      })
    case 'location':
      return wrapPreviewItem({
        sectionId,
        index,
        className: shell,
        style: delay,
        children: <LocationCard item={item} />,
      })
    case 'video':
      return wrapPreviewItem({
        sectionId,
        index,
        className: shell,
        style: delay,
        children: <VideoCard item={item} />,
      })
    case 'slide':
      return wrapPreviewItem({
        sectionId,
        index,
        className: shell,
        style: delay,
        children: <SlideCard item={item} />,
      })
    case 'products':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        children: <ProductsCard item={item} />,
      })
    case 'youtube-embed':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        children: <YoutubeEmbedCard item={item} />,
      })
    case 'spotify-embed':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        children: <SpotifyEmbedCard item={item} />,
      })
    default:
      return null
  }
}

export function BioSectionBlock({
  section,
  pageBackground = '#000000',
  focusItemIndex = null,
}: {
  section: BioSection
  /** Fundo efetivo da bio — ver BioPage.tsx (resolveEffectiveBioBackground). */
  pageBackground?: string
  focusItemIndex?: number | null
}) {
  const isGrid = section.layout === 'grid-2'

  return (
    <section>
      <SectionTitle title={section.title} subtitle={section.subtitle} />
      {isGrid ? (
        <div className="mb-3 grid grid-cols-2 items-stretch gap-3">
          {section.items.map((item, index) =>
            renderItem(item, index, true, section.id, focusItemIndex === index, pageBackground),
          )}
        </div>
      ) : (
        <div className="mb-3 space-y-3">
          {groupStackSectionItems(section.items).map((row, rowIndex) => {
            if (row.length === 1 && itemUsesGridLayout(row[0], false)) {
              const itemIndex = section.items.indexOf(row[0])
              return (
                <div key={`row-${rowIndex}`} className="grid grid-cols-2 items-stretch gap-3">
                  {renderItem(
                    row[0],
                    itemIndex >= 0 ? itemIndex : rowIndex,
                    false,
                    section.id,
                    focusItemIndex === itemIndex,
                    pageBackground,
                  )}
                </div>
              )
            }

            if (row.length > 1) {
              return (
                <div key={`row-${rowIndex}`} className="grid grid-cols-2 items-stretch gap-3">
                  {row.map((item) => {
                    const itemIndex = section.items.indexOf(item)
                    return renderItem(
                      item,
                      itemIndex >= 0 ? itemIndex : 0,
                      false,
                      section.id,
                      focusItemIndex === itemIndex,
                      pageBackground,
                    )
                  })}
                </div>
              )
            }

            const itemIndex = section.items.indexOf(row[0])
            return renderItem(
              row[0],
              itemIndex >= 0 ? itemIndex : rowIndex,
              false,
              section.id,
              focusItemIndex === itemIndex,
              pageBackground,
            )
          })}
        </div>
      )}
    </section>
  )
}

```

## `editor/src/lib/bio.ts`

```ts
import type { BioConfig, BioSection, SectionItem, AppHeroPreset, AppHeroLayout } from '@bio-types'
import { bioJsonUrl } from '@site/lib/publicUrl'
import { normalizeBrandSocial } from '@site/lib/socialLinks'
import defaultBio from '../../../bio/public/bio.default.json'
import { APP_HERO_PRESET_LIST, createAppHero } from '@site/lib/appHeroPresets'

export { APP_HERO_PRESET_LIST, createAppHero }
export type { AppHeroPreset }
export {
  ICON_CATALOG,
  ICON_CATEGORY_LABELS,
  ICON_LABELS,
  ICON_OPTIONS,
  filterIconCatalog,
} from './iconCatalog'
export type { IconCatalogEntry, IconCategory } from './iconCatalog'

export const CARD_WIDTH_OPTIONS = [
  { value: 'full', label: 'Largura total' },
  { value: 'half', label: 'Metade (2 por linha)' },
] as const

export const CARD_TYPES = [
  {
    value: 'feature',
    label: 'Destaque',
    hint: 'Card visual com cor, imagem ou gradiente — o mais versátil.',
  },
  {
    value: 'video',
    label: 'Vídeo',
    hint: 'Vídeo próprio (MP4) com capa opcional.',
  },
  {
    value: 'youtube-embed',
    label: 'YouTube',
    hint: 'Player embutido a partir do link do vídeo.',
  },
  {
    value: 'spotify-embed',
    label: 'Spotify',
    hint: 'Playlist, álbum ou música embutidos.',
  },
  {
    value: 'slide',
    label: 'Slides (Stories)',
    hint: 'Carrossel de imagens no estilo stories.',
  },
  {
    value: 'products',
    label: 'Produtos',
    hint: 'Galeria de produtos com link e botão.',
  },
  {
    value: 'link',
    label: 'Link simples',
    hint: 'Botão clássico de link na bio (estilo da aba Aparência).',
  },
  {
    value: 'location',
    label: 'Localização',
    hint: 'Endereço com link para o mapa.',
  },
] as const

export { MEDIA_CARD_VARIANTS } from '@site/lib/mediaCardLayout'

export const FEATURE_VARIANTS = [
  { value: 'gradient', label: 'Gradiente colorido' },
  { value: 'square', label: 'Quadrado' },
  { value: 'compact', label: 'Compacto' },
  { value: 'portrait', label: 'Retrato (imagem)' },
  { value: 'banner', label: 'Banner (imagem)' },
] as const

/** Alinhamento do conteúdo no destaque em gradiente. */
export const FEATURE_ALIGNS = [
  { value: 'side', label: 'Ícone ao lado' },
  { value: 'center', label: 'Centralizado' },
] as const

/** Nome legível para listas/selects — evita mostrar IDs técnicos. */
export function sectionDisplayName(section: BioSection, index: number): string {
  const title = section.title?.trim()
  if (title) return title
  return `Seção ${index + 1}`
}

export const LAYOUT_OPTIONS = [
  { value: 'stack', label: 'Empilhado' },
  { value: 'grid-2', label: 'Grade 2 colunas' },
] as const

export const APP_HERO_LAYOUTS = [
  { value: 'default', label: 'Completo' },
  { value: 'compact', label: 'Compacto (2 colunas)' },
  { value: 'condensed', label: 'Condensado' },
] as const

export function isHeroItem(
  item: SectionItem,
): item is Extract<SectionItem, { type: 'whatsapp-hero' | 'app-hero' }> {
  return item.type === 'whatsapp-hero' || item.type === 'app-hero'
}

/** Em grade 2 colunas, cards destaque não podem usar layout completo. */
export function ensureGridHeroLayouts(section: BioSection): BioSection {
  if ((section.layout ?? 'stack') !== 'grid-2') return section

  let changed = false
  const items = section.items.map((item) => {
    if (!isHeroItem(item)) return item
    if (item.layout === 'compact' || item.layout === 'condensed') return item
    changed = true
    return { ...item, layout: 'compact' as AppHeroLayout }
  })

  return changed ? { ...section, items } : section
}

export function resolveHeroLayout(isGrid: boolean, layout?: AppHeroLayout): AppHeroLayout {
  if (!isGrid) return layout ?? 'default'
  if (layout === 'condensed') return 'condensed'
  return 'compact'
}

export function heroLayoutForSection(
  section: BioSection,
  layout?: AppHeroLayout,
): AppHeroLayout {
  return resolveHeroLayout((section.layout ?? 'stack') === 'grid-2', layout)
}

export function newHeroItemForSection(
  section: BioSection,
  item: Extract<SectionItem, { type: 'whatsapp-hero' | 'app-hero' }>,
): Extract<SectionItem, { type: 'whatsapp-hero' | 'app-hero' }> {
  const layout = heroLayoutForSection(section, item.layout)
  return layout === item.layout ? item : { ...item, layout }
}

export function normalizeBioConfig(config: BioConfig): BioConfig {
  const defaults = structuredClone(defaultBio as BioConfig)
  const raw = (config ?? {}) as BioConfig & { name?: string }

  // Shape quebrada de provision antigo: { name, sections } sem brand
  const incomingBrand =
    raw.brand ??
    (typeof raw.name === 'string'
      ? ({ name: raw.name } as BioConfig['brand'])
      : undefined)

  const brand = {
    ...defaults.brand,
    ...(incomingBrand ?? {}),
    theme: {
      ...defaults.brand.theme,
      ...(incomingBrand?.theme ?? {}),
    },
    seo: {
      ...defaults.brand.seo,
      ...(incomingBrand?.seo ?? {}),
    },
    instagram: {
      handle: incomingBrand?.instagram?.handle ?? defaults.brand.instagram?.handle ?? '',
      url: incomingBrand?.instagram?.url ?? defaults.brand.instagram?.url ?? '',
    },
  }

  return {
    ...defaults,
    ...raw,
    brand: normalizeBrandSocial(brand),
    sections: Array.isArray(raw.sections) ? raw.sections : [],
  }
}

export function createDefaultConfig(): BioConfig {
  return normalizeBioConfig(structuredClone(defaultBio as BioConfig))
}

/** @deprecated Use createDefaultConfig — mantido para compatibilidade */
export function createEmptyConfig(): BioConfig {
  return createDefaultConfig()
}

export function createSection(): BioSection {
  return {
    id: `secao-${Date.now()}`,
    title: 'Nova seção',
    items: [],
  }
}

export function cloneItem(item: SectionItem): SectionItem {
  return JSON.parse(JSON.stringify(item)) as SectionItem
}

export function createItem(type: SectionItem['type']): SectionItem {
  switch (type) {
    case 'whatsapp-hero':
      return {
        type,
        badge: 'Comunidade',
        title: 'Entre na comunidade',
        description: 'Descrição do grupo',
        cta: 'Entrar agora',
        url: 'https://',
      }
    case 'app-hero':
      return createAppHero('whatsapp')
    case 'feature':
      return {
        type,
        title: 'Novo destaque',
        description: 'Descrição do card',
        url: 'https://',
        variant: 'gradient',
      }
    case 'link':
      return {
        type,
        title: 'Novo link',
        subtitle: 'Subtítulo opcional',
        url: 'https://',
      }
    case 'grid':
      return {
        type,
        title: 'Novo card',
        url: 'https://',
        gradient:
          'linear-gradient(135deg, oklch(0.70 0.18 55) 0%, oklch(0.55 0.19 40) 100%)',
      }
    case 'location':
      return {
        type,
        title: 'Local',
        address: 'Endereço completo',
        mapUrl: 'https://maps.google.com',
      }
    case 'video':
      return {
        type,
        title: 'Novo vídeo',
        description: '',
        video: '',
        variant: 'portrait',
      }
    case 'slide':
      return {
        type,
        title: '',
        variant: 'portrait',
        autoplay: true,
        slides: [{ image: '', duration: 5 }],
      }
    case 'products':
      return {
        type,
        title: 'Produtos',
        products: [{ image: '', title: '', url: '', cta: 'Compre aqui' }],
      }
    case 'youtube-embed':
      return {
        type,
        title: '',
        url: 'https://www.youtube.com/watch?v=',
      }
    case 'spotify-embed':
      return {
        type,
        title: '',
        embed: '',
      }
    default:
      return {
        type: 'link',
        title: 'Novo link',
        url: 'https://',
      }
  }
}

export async function loadBioConfig(): Promise<BioConfig> {
  const response = await fetch(bioJsonUrl(), { cache: 'no-store' })
  if (!response.ok) throw new Error('Não foi possível carregar bio.json')
  const data = (await response.json()) as BioConfig
  return normalizeBioConfig(data)
}

export function downloadBioConfig(config: BioConfig) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'bio.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function copyBioConfig(config: BioConfig) {
  await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
}

```

## `editor/src/lib/color.ts`

```ts
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('')}`
}

export interface Hsv {
  h: number
  s: number
  v: number
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6)
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ]
}

export function hexToHsv(hex: string): Hsv {
  const [r255, g255, b255] = hexToRgb(hex)
  const r = r255 / 255
  const g = g255 / 255
  const b = b255 / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }

  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

export function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g] = [c, x]
  else if (h < 120) [r, g] = [x, c]
  else if (h < 180) [g, b] = [c, x]
  else if (h < 240) [g, b] = [x, c]
  else if (h < 300) [r, b] = [x, c]
  else [r, b] = [c, x]
  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  )
}

// getImageData/canvas são caros; reaproveitamos um único canvas e cacheamos
// os resultados para não recriar contexto a cada render (evita travar o navegador
// enquanto o seletor de cor dispara eventos ao vivo).
const hexCache = new Map<string, string>()
let sharedCtx: CanvasRenderingContext2D | null | undefined

function getSharedCtx(): CanvasRenderingContext2D | null {
  if (sharedCtx !== undefined) return sharedCtx
  if (typeof document === 'undefined') {
    sharedCtx = null
    return null
  }
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  sharedCtx = canvas.getContext('2d', { willReadFrequently: true })
  return sharedCtx
}

export function cssToHex(color: string, fallback = '#e8a838'): string {
  if (!color) return fallback
  const trimmed = color.trim()
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase()
  if (/^#[0-9a-f]{8}$/i.test(trimmed)) return `#${trimmed.slice(1, 7).toLowerCase()}`

  const cacheKey = `${trimmed}|${fallback}`
  const cached = hexCache.get(cacheKey)
  if (cached) return cached

  const ctx = getSharedCtx()
  if (!ctx) return fallback

  // Rejeita valores que não são cores CSS válidas antes de tentar converter.
  if (typeof CSS !== 'undefined' && CSS.supports && !CSS.supports('color', trimmed)) {
    hexCache.set(cacheKey, fallback)
    return fallback
  }

  // Canvas normaliza qualquer cor CSS válida (oklch, hsl, rgb, nomes...) para sRGB.
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = trimmed
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  const hex = rgbToHex(r, g, b)
  hexCache.set(cacheKey, hex)
  return hex
}

export function parseColorAlpha(value: string): { hex: string; opacity: number } {
  const fallback = { hex: '#e8a838', opacity: 0.28 }
  if (!value) return fallback

  let opacity = 1
  const slashMatch = value.match(/\/\s*([\d.]+%?)\s*\)/)
  if (slashMatch) {
    const raw = slashMatch[1]
    opacity = raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw)
  } else {
    const rgbaMatch = value.match(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([\d.]+)\s*\)/)
    if (rgbaMatch) opacity = parseFloat(rgbaMatch[1])
  }

  const hex = cssToHex(value, fallback.hex)
  return { hex, opacity: Number.isFinite(opacity) ? opacity : fallback.opacity }
}

export function buildGlowColor(hex: string, opacity: number): string {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

```

## `editor/src/lib/colorPalettes.ts`

```ts
export interface ColorPalette {
  id: string
  name: string
  tag?: string
  swatch: string
  primary: string
  secondary: string
  background: string
  glow: string
}

/** Paletas por perfil — nomes que o cliente reconhece na hora */
export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'igreja',
    name: 'Igreja',
    tag: 'Dourado',
    swatch: 'linear-gradient(135deg, #d4a017, #1a1520)',
    primary: 'oklch(0.72 0.14 85)',
    secondary: 'oklch(0.82 0.08 90)',
    background: 'oklch(0.11 0.025 280)',
    glow: 'oklch(0.72 0.14 85 / 0.28)',
  },
  {
    id: 'confeitaria',
    name: 'Confeitaria',
    tag: 'Doce',
    swatch: 'linear-gradient(135deg, #f472b6, #2a1520)',
    primary: 'oklch(0.72 0.18 350)',
    secondary: 'oklch(0.82 0.1 355)',
    background: 'oklch(0.13 0.03 350)',
    glow: 'oklch(0.72 0.16 350 / 0.28)',
  },
  {
    id: 'barbearia',
    name: 'Barbearia',
    tag: 'Masculino',
    swatch: 'linear-gradient(135deg, #c9a227, #0d0d0d)',
    primary: 'oklch(0.75 0.12 85)',
    secondary: 'oklch(0.68 0.02 260)',
    background: 'oklch(0.1 0.01 260)',
    glow: 'oklch(0.75 0.12 85 / 0.22)',
  },
  {
    id: 'saude',
    name: 'Saúde',
    tag: 'Clínica',
    swatch: 'linear-gradient(135deg, #2dd4bf, #0f1f1c)',
    primary: 'oklch(0.72 0.12 175)',
    secondary: 'oklch(0.78 0.07 180)',
    background: 'oklch(0.13 0.03 180)',
    glow: 'oklch(0.65 0.12 175 / 0.28)',
  },
  {
    id: 'moda',
    name: 'Moda',
    tag: 'Elegante',
    swatch: 'linear-gradient(135deg, #e8b4b8, #141014)',
    primary: 'oklch(0.78 0.1 15)',
    secondary: 'oklch(0.85 0.04 15)',
    background: 'oklch(0.11 0.015 350)',
    glow: 'oklch(0.78 0.1 15 / 0.2)',
  },
  {
    id: 'restaurante',
    name: 'Restaurante',
    tag: 'Gastronomia',
    swatch: 'linear-gradient(135deg, #ef4444, #1a100e)',
    primary: 'oklch(0.62 0.22 25)',
    secondary: 'oklch(0.78 0.08 70)',
    background: 'oklch(0.12 0.03 30)',
    glow: 'oklch(0.62 0.2 25 / 0.28)',
  },
  {
    id: 'fitness',
    name: 'Fitness',
    tag: 'Energia',
    swatch: 'linear-gradient(135deg, #84cc16, #0f1608)',
    primary: 'oklch(0.75 0.2 130)',
    secondary: 'oklch(0.82 0.1 130)',
    background: 'oklch(0.11 0.03 130)',
    glow: 'oklch(0.75 0.18 130 / 0.28)',
  },
  {
    id: 'influencer',
    name: 'Influencer',
    tag: 'Instagram',
    swatch: 'linear-gradient(135deg, #a855f7, #ec4899)',
    primary: 'oklch(0.65 0.22 310)',
    secondary: 'oklch(0.72 0.18 350)',
    background: 'oklch(0.12 0.04 300)',
    glow: 'oklch(0.65 0.2 310 / 0.32)',
  },
  {
    id: 'infantil',
    name: 'Infantil',
    tag: 'Alegre',
    swatch: 'linear-gradient(135deg, #38bdf8, #fbbf24)',
    primary: 'oklch(0.72 0.16 230)',
    secondary: 'oklch(0.82 0.16 85)',
    background: 'oklch(0.14 0.03 260)',
    glow: 'oklch(0.72 0.14 230 / 0.25)',
  },
  {
    id: 'corporativo',
    name: 'Corporativo',
    tag: 'Profissional',
    swatch: 'linear-gradient(135deg, #3b82f6, #0f172a)',
    primary: 'oklch(0.62 0.18 255)',
    secondary: 'oklch(0.72 0.06 255)',
    background: 'oklch(0.13 0.03 260)',
    glow: 'oklch(0.62 0.16 255 / 0.28)',
  },
  {
    id: 'beleza',
    name: 'Beleza',
    tag: 'Estética',
    swatch: 'linear-gradient(135deg, #f9a8d4, #1a1018)',
    primary: 'oklch(0.78 0.14 340)',
    secondary: 'oklch(0.85 0.08 340)',
    background: 'oklch(0.13 0.025 340)',
    glow: 'oklch(0.78 0.12 340 / 0.25)',
  },
  {
    id: 'pet',
    name: 'Pet shop',
    tag: 'Pet',
    swatch: 'linear-gradient(135deg, #fb923c, #1a1208)',
    primary: 'oklch(0.72 0.18 55)',
    secondary: 'oklch(0.78 0.1 55)',
    background: 'oklch(0.12 0.025 60)',
    glow: 'oklch(0.72 0.16 55 / 0.28)',
  },
]

```

## `editor/src/lib/extractImagePalette.ts`

```ts
import { buildGlowColor } from './color'

interface Rgb {
  r: number
  g: number
  b: number
}

export interface ExtractedPalette {
  primary: string
  secondary: string
  glow: string
  swatch: string
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`
}

function relLuminance({ r, g, b }: Rgb): number {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

function rgbToHsv({ r, g, b }: Rgb): { h: number; s: number; v: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function hsvToRgb(h: number, s: number, v: number): Rgb {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g] = [c, x]
  else if (h < 120) [r, g] = [x, c]
  else if (h < 180) [g, b] = [c, x]
  else if (h < 240) [g, b] = [x, c]
  else if (h < 300) [r, b] = [x, c]
  else [r, b] = [c, x]
  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255,
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem'))
    img.src = src
  })
}

function ensureContrast(accent: Rgb, bg: Rgb): Rgb {
  const bgL = relLuminance(bg)
  const accentL = relLuminance(accent)
  const gap = Math.abs(bgL - accentL)

  if (gap >= 0.28) return accent

  const accentHsv = rgbToHsv(accent)
  const bgHsv = rgbToHsv(bg)
  const hue = accentHsv.s > 0.12 ? accentHsv.h : bgHsv.h
  const sat = Math.max(accentHsv.s, bgHsv.s, 0.45)

  if (bgL > 0.42) {
    return hsvToRgb(hue, Math.min(0.85, sat + 0.2), 0.38)
  }
  return hsvToRgb(hue, Math.min(0.9, sat + 0.1), 0.78)
}

/** Extrai cores com bom contraste a partir de uma imagem de fundo. */
export async function extractPaletteFromImage(imageUrl: string): Promise<ExtractedPalette> {
  const img = await loadImage(imageUrl)
  const size = 96
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas indisponível')

  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  let sumR = 0
  let sumG = 0
  let sumB = 0
  let count = 0

  const hueBuckets = new Map<
    number,
    { r: number; g: number; b: number; weight: number; sat: number }
  >()

  for (let i = 0; i < data.length; i += 4) {
    const pixel: Rgb = { r: data[i], g: data[i + 1], b: data[i + 2] }
    const alpha = data[i + 3]
    if (alpha < 40) continue

    sumR += pixel.r
    sumG += pixel.g
    sumB += pixel.b
    count++

    const { h, s, v } = rgbToHsv(pixel)
    if (s < 0.18 || v < 0.12 || v > 0.95) continue

    const bucket = Math.round(h / 24) * 24
    const prev = hueBuckets.get(bucket) ?? { r: 0, g: 0, b: 0, weight: 0, sat: 0 }
    const weight = s * s
    prev.r += pixel.r * weight
    prev.g += pixel.g * weight
    prev.b += pixel.b * weight
    prev.weight += weight
    prev.sat = Math.max(prev.sat, s)
    hueBuckets.set(bucket, prev)
  }

  const avgBg: Rgb = count
    ? { r: sumR / count, g: sumG / count, b: sumB / count }
    : { r: 40, g: 35, b: 30 }

  let accent: Rgb | undefined
  let bestScore = 0

  for (const bucket of hueBuckets.values()) {
    if (bucket.weight <= 0) continue
    const candidate: Rgb = {
      r: bucket.r / bucket.weight,
      g: bucket.g / bucket.weight,
      b: bucket.b / bucket.weight,
    }
    const score = bucket.weight * (0.5 + bucket.sat)
    if (score > bestScore) {
      bestScore = score
      accent = candidate
    }
  }

  if (!accent) {
    const bgHsv = rgbToHsv(avgBg)
    accent = hsvToRgb((bgHsv.h + 180) % 360, 0.72, bgHsv.v > 0.5 ? 0.42 : 0.78)
  }

  const primaryRgb = ensureContrast(accent, avgBg)
  const primaryHsv = rgbToHsv(primaryRgb)
  const secondaryRgb = hsvToRgb(
    primaryHsv.h,
    Math.max(0.25, primaryHsv.s * 0.55),
    Math.min(0.88, primaryHsv.v + 0.12),
  )

  const primary = rgbToHex(primaryRgb)
  const secondary = rgbToHex(secondaryRgb)
  const glow = buildGlowColor(primary, 0.32)

  return {
    primary,
    secondary,
    glow,
    swatch: `linear-gradient(135deg, ${primary}, ${secondary})`,
  }
}

```

## `editor/src/components/AppearanceForm.tsx`

```tsx
import { useState } from 'react'
import type { BioBrand, BioTemplate } from '@bio-types'
import { resolvePublicUrl } from '@site/lib/publicUrl'
import { BACKGROUND_PRESETS } from '@site/lib/backgroundPresets'
import { BIO_TEMPLATE_LIST, DEFAULT_BIO_TEMPLATE } from '@site/lib/templates'
import {
  cardRadiusLabel,
  resolveCardRadius,
  resolveCardRadiusPx,
} from '@site/lib/cardRadius'
import { COLOR_PALETTES, type ColorPalette } from '../lib/colorPalettes'
import { extractPaletteFromImage, type ExtractedPalette } from '../lib/extractImagePalette'
import { ColorField, GlowColorField } from './ColorField'
import { EditorSubnav } from './EditorSubnav'
import { ImageField } from './ImageField'

type AppearanceTab = 'background' | 'colors' | 'links'

const APPEARANCE_TABS = [
  { id: 'background' as const, label: 'Fundo' },
  { id: 'colors' as const, label: 'Cores' },
  { id: 'links' as const, label: 'Estilo dos links' },
]

interface AppearanceFormProps {
  brand: BioBrand
  onChange: (brand: BioBrand) => void
}

export function AppearanceForm({ brand, onChange }: AppearanceFormProps) {
  const [tab, setTab] = useState<AppearanceTab>('background')
  const activeTemplate = brand.template ?? DEFAULT_BIO_TEMPLATE
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [imagePalette, setImagePalette] = useState<ExtractedPalette | null>(null)

  const hasBgImage = Boolean(brand.theme.backgroundImage)
  const activeBgPreset = brand.theme.backgroundPreset
  const activePreset = BACKGROUND_PRESETS.find((preset) => preset.id === activeBgPreset)
  const cardRadius = resolveCardRadius(brand.theme.cardRadius)
  const cardRadiusPx = resolveCardRadiusPx(brand.theme.cardRadius)

  function setTemplate(template: BioTemplate) {
    onChange({ ...brand, template })
  }

  function applyThemeColors(colors: { primary: string; secondary: string; glow: string }) {
    onChange({
      ...brand,
      theme: {
        ...brand.theme,
        primary: colors.primary,
        secondary: colors.secondary,
        glow: colors.glow,
      },
    })
  }

  function applyPalette(palette: ColorPalette) {
    onChange({
      ...brand,
      theme: {
        ...brand.theme,
        primary: palette.primary,
        secondary: palette.secondary,
        background: brand.theme.backgroundImage ? brand.theme.background : palette.background,
        glow: palette.glow,
      },
    })
  }

  async function suggestColorsFromBackground(
    imagePath?: string,
    baseBrand: BioBrand = brand,
  ) {
    const path = imagePath ?? baseBrand.theme.backgroundImage
    if (!path) return

    setExtracting(true)
    setExtractError(null)
    try {
      const palette = await extractPaletteFromImage(resolvePublicUrl(path))
      setImagePalette(palette)
      onChange({
        ...baseBrand,
        theme: {
          ...baseBrand.theme,
          primary: palette.primary,
          secondary: palette.secondary,
          glow: palette.glow,
        },
      })
    } catch {
      setExtractError('Não foi possível ler as cores da imagem. Tente salvar e recarregar.')
    } finally {
      setExtracting(false)
    }
  }

  function applyBackgroundPreset(presetId: string) {
    const preset = BACKGROUND_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    onChange({
      ...brand,
      theme: {
        ...brand.theme,
        backgroundPreset: presetId,
        backgroundImage: undefined,
        background: preset.edgeColor,
        primary: preset.primary,
        secondary: preset.secondary,
        glow: preset.glow,
      },
    })
    setImagePalette(null)
    setExtractError(null)
  }

  function clearBackgroundPreset() {
    onChange({
      ...brand,
      theme: { ...brand.theme, backgroundPreset: undefined },
    })
  }

  return (
    <div>
      <EditorSubnav tabs={APPEARANCE_TABS} active={tab} onChange={(id) => setTab(id as AppearanceTab)} />

      {tab === 'background' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-1 text-sm font-semibold">Fundos em gradiente</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Estilo spotlight radial. Ao escolher, ajustamos as cores automaticamente. Imagem de fundo tem prioridade.
            </p>
            {activeBgPreset && !hasBgImage && (
              <button
                type="button"
                className="mb-3 text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={clearBackgroundPreset}
              >
                Remover gradiente
              </button>
            )}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {BACKGROUND_PRESETS.map((preset) => {
                const selected = activeBgPreset === preset.id && !hasBgImage
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyBackgroundPreset(preset.id)}
                    disabled={hasBgImage}
                    className={`overflow-hidden rounded-lg border text-left transition-colors ${
                      selected
                        ? 'border-primary ring-1 ring-primary/40'
                        : 'border-border hover:border-primary/40'
                    } ${hasBgImage ? 'cursor-not-allowed opacity-40' : ''}`}
                    title={preset.name}
                  >
                    <span
                      className="block aspect-[3/4] w-full"
                      style={{ background: preset.gradient }}
                    />
                    <span className="block px-1.5 py-1">
                      <span className="block text-[10px] font-semibold leading-tight">{preset.name}</span>
                      {preset.tag && (
                        <span className="block text-[9px] text-muted-foreground">{preset.tag}</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            {activePreset && !hasBgImage && (
              <p className="mt-3 text-[10px] text-muted-foreground">
                Cores ajustadas para <span className="font-semibold text-foreground">{activePreset.name}</span> — edite na aba <span className="font-medium">Cores</span>.
              </p>
            )}
          </div>

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold">Imagem ou cor sólida</h3>
            <div className="grid grid-cols-1 gap-3">
              <ImageField
                label="Imagem de fundo (página inteira)"
                value={brand.theme.backgroundImage}
                onChange={(backgroundImage) => {
                  const nextBrand: BioBrand = {
                    ...brand,
                    theme: {
                      ...brand.theme,
                      backgroundImage: backgroundImage || undefined,
                      backgroundPreset: backgroundImage ? undefined : brand.theme.backgroundPreset,
                    },
                  }
                  onChange(nextBrand)
                  if (backgroundImage) {
                    void suggestColorsFromBackground(backgroundImage, nextBrand)
                  } else {
                    setImagePalette(null)
                    setExtractError(null)
                  }
                }}
                hint="Cobre toda a tela. Ao enviar, sugerimos cores na aba Cores."
              />
              <ColorField
                label="Cor de fundo sólida"
                value={brand.theme.background ?? ''}
                onChange={(background) =>
                  onChange({
                    ...brand,
                    theme: {
                      ...brand.theme,
                      background: background || undefined,
                      backgroundPreset: undefined,
                    },
                  })
                }
                hint={
                  hasBgImage
                    ? 'Com imagem, a cor sólida não cobre a página'
                    : activeBgPreset
                      ? 'Gradiente ativo — remova-o para usar cor sólida'
                      : 'Deixe vazio para o fundo escuro padrão'
                }
              />
            </div>

            {hasBgImage && (
              <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 p-3">
                <p className="text-[11px] font-medium text-foreground/90">Cores da imagem de fundo</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-3 py-1.5 text-xs"
                    disabled={extracting}
                    onClick={() => suggestColorsFromBackground()}
                  >
                    {extracting ? 'Analisando…' : 'Sugerir cores do fundo'}
                  </button>
                  {imagePalette && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/40 px-2 py-1 text-[10px] hover:border-primary/40"
                      onClick={() => applyThemeColors(imagePalette)}
                    >
                      <span
                        className="h-5 w-5 rounded border border-border/60"
                        style={{ background: imagePalette.swatch }}
                      />
                      Reaplicar
                    </button>
                  )}
                </div>
                {extractError && <p className="mt-2 text-[10px] text-red-400">{extractError}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'colors' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-2 text-sm font-semibold">Paletas por perfil</h3>
            <p className="mb-3 text-[10px] text-muted-foreground">
              Atalhos para igreja, confeitaria, saúde e outros nichos.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => applyPalette(palette)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background/30 px-2.5 py-2 text-left transition-colors hover:border-primary/45 hover:bg-primary/5"
                  title={`Aplicar paleta ${palette.name}`}
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-md border border-border/60 shadow-inner"
                    style={{ background: palette.swatch }}
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold leading-tight">{palette.name}</span>
                    {palette.tag && (
                      <span className="block text-[9px] text-muted-foreground">{palette.tag}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-1 text-sm font-semibold">Cores do tema</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Primária, secundária e brilho usados nos botões, títulos e destaques da bio.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ColorField
                label="Cor primária"
                value={brand.theme.primary}
                onChange={(primary) =>
                  onChange({ ...brand, theme: { ...brand.theme, primary } })
                }
                hint="Botões, destaques e títulos de seção"
              />
              <ColorField
                label="Cor secundária"
                value={brand.theme.secondary ?? ''}
                onChange={(secondary) =>
                  onChange({
                    ...brand,
                    theme: { ...brand.theme, secondary: secondary || undefined },
                  })
                }
                hint="Tagline, subtítulos e textos de apoio"
              />
              <div className="sm:col-span-2">
                <GlowColorField
                  label="Brilho de fundo"
                  value={brand.theme.glow ?? ''}
                  onChange={(glow) =>
                    onChange({
                      ...brand,
                      theme: { ...brand.theme, glow: glow || undefined },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'links' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-1 text-sm font-semibold">Template dos links simples</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Afeta cards do tipo <strong className="font-medium text-foreground/90">Link simples</strong> e localização — não altera destaques (WhatsApp/YouTube) nem cards com imagem.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BIO_TEMPLATE_LIST.map((item) => {
                const selected = activeTemplate === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTemplate(item.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      selected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                        : 'border-border bg-background/40 hover:border-primary/40'
                    }`}
                  >
                    <div className={`bio-tpl-preview ${item.previewClass} mb-2`}>
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="block text-xs font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                      {item.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="text-sm font-semibold">Arredondamento</label>
              <span className="text-[10px] text-muted-foreground">
                {cardRadiusLabel(cardRadius)} · {cardRadiusPx}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={cardRadius}
              onChange={(e) =>
                onChange({
                  ...brand,
                  theme: { ...brand.theme, cardRadius: Number(e.target.value) },
                })
              }
              className="color-opacity-slider w-full"
              aria-label="Arredondamento dos cards"
            />
            <div className="mt-3 flex items-end gap-2">
              {[0, 35, 70, 100].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() =>
                    onChange({ ...brand, theme: { ...brand.theme, cardRadius: step } })
                  }
                  className={`flex h-10 flex-1 items-center justify-center border transition-colors ${
                    cardRadius === step
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background/40 hover:border-primary/35'
                  }`}
                  style={{ borderRadius: resolveCardRadiusPx(step) }}
                  title={cardRadiusLabel(step)}
                >
                  <span className="sr-only">{cardRadiusLabel(step)}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground/75">
              Afeta links, localização, destaques e cards com imagem. Pill em 2 colunas fica retangular arredondado.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

```

## `editor/src/components/ColorField.tsx`

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { buildGlowColor, cssToHex, hexToHsv, hsvToHex, parseColorAlpha } from '../lib/color'

interface ColorInputProps {
  value: string
  onChange: (hex: string) => void
  title?: string
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

// Seletor de cor próprio (sem o <input type="color"> nativo, que traz o
// conta-gotas do Chrome e causava o travamento). Área de saturação/brilho +
// slider de matiz + campo hex, com commit debounced para o pai.
export function ColorInput({ value, onChange, title }: ColorInputProps) {
  const [open, setOpen] = useState(false)
  const [hsv, setHsv] = useState(() => hexToHsv(value))
  const [hexText, setHexText] = useState(value)
  const timer = useRef<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setHsv(hexToHsv(value))
      setHexText(value)
    }
    // Sincroniza a partir do valor externo apenas ao abrir o popover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function commit(hex: string) {
    setHexText(hex)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onChange(hex), 60)
  }

  function updateHsv(next: Partial<{ h: number; s: number; v: number }>) {
    const merged = { ...hsv, ...next }
    setHsv(merged)
    commit(hsvToHex(merged.h, merged.s, merged.v))
  }

  function handleSv(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    updateHsv({
      s: clamp01((e.clientX - rect.left) / rect.width),
      v: clamp01(1 - (e.clientY - rect.top) / rect.height),
    })
  }

  const hueHex = hsvToHex(hsv.h, 1, 1)

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className="color-picker"
        style={{ background: value }}
        title={title ?? 'Selecionar cor'}
        onClick={() => setOpen((o) => !o)}
        aria-label={title ?? 'Selecionar cor'}
      />

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[210px] rounded-xl border border-border bg-card p-3 shadow-2xl">
          <div
            className="relative h-32 w-full cursor-crosshair rounded-lg"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueHex})`,
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              handleSv(e)
            }}
            onPointerMove={(e) => {
              if (e.buttons === 1) handleSv(e)
            }}
          >
            <span
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                background: hsvToHex(hsv.h, hsv.s, hsv.v),
              }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={360}
            value={Math.round(hsv.h)}
            onChange={(e) => updateHsv({ h: Number(e.target.value) })}
            className="color-hue-slider mt-3 w-full"
            aria-label="Matiz"
          />

          <div className="mt-3 flex items-center gap-2">
            <span
              className="h-7 w-7 shrink-0 rounded-md border border-border"
              style={{ background: hexText }}
            />
            <input
              type="text"
              value={hexText}
              onChange={(e) => {
                const next = e.target.value
                setHexText(next)
                if (/^#[0-9a-f]{6}$/i.test(next)) {
                  setHsv(hexToHsv(next))
                  commit(next)
                }
              }}
              className="flex-1 text-xs"
              placeholder="#000000"
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface ColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
}

export function ColorField({ label, value, onChange, hint }: ColorFieldProps) {
  const pickerValue = useMemo(() => cssToHex(value), [value])

  return (
    <div className="field">
      <label>{label}</label>
      <div className="flex items-center gap-2">
        <ColorInput value={pickerValue} onChange={onChange} title="Selecionar cor" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#e8a838 ou oklch(...)"
          className="flex-1"
        />
        <span
          className="h-9 w-9 shrink-0 rounded-lg border border-border"
          style={{ background: value || pickerValue }}
          title="Prévia"
        />
      </div>
      {hint && <p className="mt-1 text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

interface GlowColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function GlowColorField({ label, value, onChange }: GlowColorFieldProps) {
  const { hex, opacity } = useMemo(() => parseColorAlpha(value), [value])
  const percent = Math.round(opacity * 100)

  return (
    <div className="field">
      <label>{label}</label>
      <div className="flex items-center gap-2">
        <ColorInput
          value={hex}
          onChange={(h) => onChange(buildGlowColor(h, opacity))}
          title="Cor do brilho"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <span
          className="h-9 w-9 shrink-0 rounded-lg border border-border"
          style={{ background: value || buildGlowColor(hex, opacity) }}
          title="Prévia"
        />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={percent}
          onChange={(e) => onChange(buildGlowColor(hex, Number(e.target.value) / 100))}
          className="color-opacity-slider flex-1"
        />
        <span className="w-10 text-right text-xs text-muted-foreground">{percent}%</span>
      </div>
    </div>
  )
}

```

## `editor/src/components/GradientField.tsx`

```tsx
import { useMemo } from 'react'
import { cssToHex } from '../lib/color'
import { ColorInput } from './ColorField'

interface GradientFieldProps {
  label: string
  value?: string
  onChange: (value: string) => void
}

interface ParsedGradient {
  angle: number
  from: string
  to: string
}

function parseGradient(value?: string): ParsedGradient {
  const fallback: ParsedGradient = { angle: 135, from: '#e8a838', to: '#c25a2b' }
  if (!value) return fallback

  const angleMatch = value.match(/(\d+)deg/)
  const colorMatches = value.match(/(#[0-9a-f]{3,8}|oklch\([^)]*\)|rgb[a]?\([^)]*\)|hsl[a]?\([^)]*\))/gi)

  return {
    angle: angleMatch ? Number(angleMatch[1]) : fallback.angle,
    from: colorMatches?.[0] ? cssToHex(colorMatches[0], fallback.from) : fallback.from,
    to: colorMatches?.[1] ? cssToHex(colorMatches[1], fallback.to) : fallback.to,
  }
}

function buildGradient({ angle, from, to }: ParsedGradient): string {
  return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`
}

export function GradientField({ label, value, onChange }: GradientFieldProps) {
  const parsed = useMemo(() => parseGradient(value), [value])

  function set(next: Partial<ParsedGradient>) {
    onChange(buildGradient({ ...parsed, ...next }))
  }

  return (
    <div className="field">
      <label>{label}</label>

      <div
        className="mb-2 h-12 w-full rounded-lg border border-border"
        style={{ background: value || buildGradient(parsed) }}
        title="Prévia do gradiente"
      />

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <ColorInput value={parsed.from} onChange={(from) => set({ from })} title="Cor inicial" />
          <span className="text-[9px] text-muted-foreground">Início</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <ColorInput value={parsed.to} onChange={(to) => set({ to })} title="Cor final" />
          <span className="text-[9px] text-muted-foreground">Fim</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={360}
              value={parsed.angle}
              onChange={(e) => set({ angle: Number(e.target.value) })}
              className="flex-1 accent-[var(--color-primary)]"
            />
            <span className="w-12 text-right text-xs text-muted-foreground">{parsed.angle}°</span>
          </div>
          <p className="mt-1 text-[9px] text-muted-foreground/70">Ângulo</p>
        </div>
      </div>

      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 text-xs"
        placeholder="linear-gradient(...)"
      />
    </div>
  )
}

```

## `bio/src/index.css` (trecho @theme + cards — primeiras 200 linhas)

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Inter", ui-sans-serif, system-ui, sans-serif;

  --color-background: oklch(0.12 0.02 260);
  --color-foreground: oklch(0.97 0.01 260);
  --color-muted-foreground: oklch(0.65 0.02 260);
  --color-card: oklch(0.16 0.025 260);
  --color-border: oklch(0.28 0.03 260);
  --color-primary: oklch(0.72 0.16 55);
  --color-secondary: oklch(0.78 0.1 55);
  --bio-card-radius: 1rem;
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in oklch, var(--color-primary) 45%, transparent) transparent;
  }

  body {
    @apply min-h-screen bg-background text-foreground antialiased;
    font-family: var(--font-sans);
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 9999px;
    background: color-mix(in oklch, var(--color-primary) 35%, transparent);
    transition: background 0.2s ease;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: color-mix(in oklch, var(--color-primary) 60%, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
}

@keyframes bio-pulse {
  0% {
    transform: scale(0.92);
    opacity: 0.85;
  }
  100% {
    transform: scale(1.45);
    opacity: 0;
  }
}

@keyframes bio-glow {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 0.95;
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 0.5s ease-out forwards;
}

html[data-bio-preview] .animate-fade-up {
  animation: none !important;
  opacity: 1;
  transform: none;
}

html[data-bio-preview] .bio-preview-selectable {
  cursor: pointer;
}

html[data-bio-preview] .bio-preview-selectable:hover {
  outline: 1px dashed color-mix(in oklch, var(--color-primary) 55%, transparent);
  outline-offset: 2px;
}

.bio-preview-focus {
  outline: 2px solid color-mix(in oklch, var(--color-primary) 85%, white);
  outline-offset: 3px;
  border-radius: calc(var(--bio-card-radius, 1rem) + 2px);
  transition: outline-color 0.2s ease;
}

/* ── Bio templates ─────────────────────────────────────────────── */

.bio-card {
  overflow: hidden;
  border-radius: var(--bio-card-radius);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease,
    border-radius 0.2s ease;
}

.bio-text-secondary {
  color: var(--color-secondary);
}

.bio-header__subtitle {
  color: color-mix(in oklch, var(--color-foreground) 82%, transparent);
}

/* Classic — borda só em cards de link/local (não em cards com gradiente/imagem) */
[data-bio-template='classic'] .bio-card.bio-link-card,
[data-bio-template='classic'] .bio-card.bio-location-card {
  border: 1px solid color-mix(in oklch, var(--color-border) 70%, transparent);
  background: var(--color-card);
}

[data-bio-template='classic'] .bio-card.bio-link-card:hover,
[data-bio-template='classic'] .bio-card.bio-location-card:hover {
  border-color: color-mix(in oklch, var(--color-primary) 50%, transparent);
}

[data-bio-template='classic'] .bio-card--media {
  border: none;
  background: transparent;
  box-shadow: none;
}

[data-bio-template='classic'] .bio-card--media:hover {
  border: none;
}

[data-bio-template='classic'] .bio-section-title {
  color: var(--color-primary);
}

/* Pill — links como botões arredondados (Linktree) */
[data-bio-template='pill'] .bio-link-card:not(.bio-link-card--grid) {
  border-radius: min(9999px, calc(var(--bio-card-radius) * 4));
  border: none;
  background: var(--bio-fill-primary, var(--color-primary));
  box-shadow: 0 8px 24px -8px color-mix(in oklch, var(--bio-fill-primary, var(--color-primary)) 55%, transparent);
}

[data-bio-template='pill'] .bio-link-card--grid {
  border-radius: var(--bio-card-radius);
  border: none;
  background: var(--bio-fill-primary, var(--color-primary));
  box-shadow: 0 6px 20px -8px color-mix(in oklch, var(--bio-fill-primary, var(--color-primary)) 55%, transparent);
  justify-content: center;
  padding: 0.875rem 0.65rem;
}

[data-bio-template='pill'] .bio-link-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px -6px color-mix(in oklch, var(--bio-fill-primary, var(--color-primary)) 65%, transparent);
}

[data-bio-template='pill'] .bio-link-card .bio-link-icon-wrap,
[data-bio-template='pill'] .bio-link-card .bio-link-arrow {
  display: none;
}

[data-bio-template='pill'] .bio-link-card--grid .bio-link-body {
  display: none;
}

[data-bio-template='pill'] .bio-link-card:not(.bio-link-card--grid) .bio-link-body {
  justify-content: center;
  padding: 1rem 1.5rem;
}

[data-bio-template='pill'] .bio-link-card .bio-link-title {

```
