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

/** Último color-stop parseável de um `gradient` (assumido ser o stop final ~100%). */
function extractGradientEndColor(gradient: string | undefined): Rgb | null {
  const tokens = extractColorTokens(gradient)
    .map(parseColor)
    .filter((c): c is Rgb => Boolean(c));
  return tokens.length > 0 ? tokens[tokens.length - 1] : null;
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
  const pageRgb = parseColor(pageBackground) ?? { r: 10, g: 10, b: 10, a: 1 }; // fallback escuro

  // 1) Luminância efetiva do PAINEL hoje: stop final do gradient, composto
  //    sobre o fundo da página (aproxima o que aparece na tela).
  const gradientEndColor = extractGradientEndColor(baseTheme.gradient);
  const panelBaseRgb = gradientEndColor ? compositeOver(gradientEndColor, pageRgb) : pageRgb;
  const panelLuminance = relativeLuminance(panelBaseRgb);
  const panelIsLight = panelLuminance > 0.5;

  // 2) Painel claro → scrim escuro em cima do gradient original (as cores de
  //    marca continuam por baixo). Painel já escuro (caso de hoje) → não mexe.
  let gradient = baseTheme.gradient;
  let finalPanelLuminance = panelLuminance;
  if (panelIsLight) {
    const scrimAmount = Math.min(SCRIM_MAX, Math.max(SCRIM_MIN, panelLuminance * 0.85)) * 100;
    gradient = reinforceBackground(baseTheme.gradient, "black", scrimAmount);
    const scrimmed = compositeOver({ r: 0, g: 0, b: 0, a: scrimAmount / 100 }, panelBaseRgb);
    finalPanelLuminance = relativeLuminance(scrimmed);
  }

  // 3) Texto do card — dinâmico, calculado a partir da luminância FINAL do
  //    painel. Isso é o que substitui o `text-white` / `text-white/85` fixos.
  const titleText = finalPanelLuminance > 0.5 ? "#0A0A0A" : "#FFFFFF";
  const bodyText =
    finalPanelLuminance > 0.5 ? "rgba(10,10,10,0.75)" : "rgba(255,255,255,0.85)";

  // 4) Borda/glow/pulse: translúcidos de marca ficam "sujos" sobre página
  //    clara (eles ficam contra a PÁGINA, não contra o painel escurecido).
  const pageLuminance = relativeLuminance(pageRgb);
  const pageIsLight = pageLuminance > 0.55;
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
