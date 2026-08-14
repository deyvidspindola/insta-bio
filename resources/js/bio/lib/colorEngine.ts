// bio/src/lib/colorEngine.ts
//
// Motor único de cores/contraste para a bio.
// Contém parsing, luminância, contraste, composição e funções de alto nível
// para resolver cores de texto, superfícies e gradientes.
// Não depende de DOM/Canvas e é autocontido.

export interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Hsv {
  h: number;
  s: number;
  v: number;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function parseColor(input: string | undefined | null): Rgb | null {
  if (!input) return null;
  const value = input.trim();

  // Hex
  const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  // rgb/rgba
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

  // Nomes básicos
  const named: Record<string, Rgb> = {
    black: { r: 0, g: 0, b: 0, a: 1 },
    white: { r: 255, g: 255, b: 255, a: 1 },
  };
  if (named[value.toLowerCase()]) return named[value.toLowerCase()];

  return null;
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

// ---------------------------------------------------------------------------
// Luminância e contraste
// ---------------------------------------------------------------------------

export function relativeLuminance(rgb: Rgb): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function compositeOver(fg: Rgb, bg: Rgb): Rgb {
  const a = clamp01(fg.a ?? 1);
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

// ---------------------------------------------------------------------------
// Extração de tokens de strings CSS
// ---------------------------------------------------------------------------

export function extractColorTokens(css: string | undefined): string[] {
  if (!css) return [];
  const rgba = css.match(/rgba?\([^)]+\)/gi) ?? [];
  const hex = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  return [...rgba, ...hex];
}

export function extractGradientColors(gradient: string | undefined): Rgb[] {
  return extractColorTokens(gradient)
    .map(parseColor)
    .filter((c): c is Rgb => Boolean(c));
}

export function extractGradientEndColor(gradient: string | undefined): Rgb | null {
  const tokens = extractGradientColors(gradient);
  return tokens.length > 0 ? tokens[tokens.length - 1] : null;
}

// ---------------------------------------------------------------------------
// Contraste de texto
// ---------------------------------------------------------------------------

export interface ContrastTextOptions {
  /** Luminância limite para decidir entre preto e branco (0.5 padrão) */
  threshold?: number;
  /** Cor para título (peso maior) */
  title?: string;
  /** Cor para corpo */
  body?: string;
  /** Cor para muted (mais transparente) */
  muted?: string;
}

export function contrastTextOn(
  bg: string,
  options: ContrastTextOptions = {}
): { title: string; body: string; muted: string } {
  const threshold = options.threshold ?? 0.5;

  let lum: number | null = null;
  const direct = parseColor(bg);
  if (direct) {
    lum = relativeLuminance(direct);
  } else {
    // Gradiente: usa o stop mais claro (pior caso para texto)
    const stops = extractGradientColors(bg);
    if (stops.length > 0) {
      lum = Math.max(...stops.map((s) => relativeLuminance(s)));
    }
  }

  if (lum === null) {
    return { title: "#FFFFFF", body: "rgba(255,255,255,0.85)", muted: "rgba(255,255,255,0.6)" };
  }

  const isLight = lum > threshold;
  return {
    title: isLight ? "#0A0A0A" : "#FFFFFF",
    body: isLight ? "rgba(10,10,10,0.75)" : "rgba(255,255,255,0.85)",
    muted: isLight ? "rgba(10,10,10,0.5)" : "rgba(255,255,255,0.6)",
  };
}

// ---------------------------------------------------------------------------
// Garantir contraste de um foreground sobre um background
// ---------------------------------------------------------------------------

export function ensureContrast(
  fg: string,
  bg: string,
  minRatio: number = 4.5
): string {
  const bgRgb = parseColor(bg);
  if (!bgRgb) return fg;
  const bgLum = relativeLuminance(bgRgb);

  // Tenta parse do foreground
  let fgRgb = parseColor(fg);
  if (!fgRgb) return fg;

  // Se já tem contraste suficiente, retorna original
  const fgLum = relativeLuminance(fgRgb);
  if (contrastRatio(fgLum, bgLum) >= minRatio) return fg;

  // Escurece ou clareia o foreground mantendo matiz via color-mix
  const mix = (color: string, towards: "black" | "white", amount: number): string => {
    const percent = Math.round(clamp01(amount / 100) * 100);
    return `color-mix(in oklch, ${color} ${100 - percent}%, ${towards} ${percent}%)`;
  };

  // Tenta escurecer ou clarear progressivamente
  const direction = fgLum > 0.5 ? "black" : "white";
  for (let amount = 10; amount <= 80; amount += 10) {
    const candidate = mix(fg, direction, amount);
    const candRgb = parseColor(candidate);
    if (!candRgb) continue;
    const candLum = relativeLuminance(candRgb);
    if (contrastRatio(candLum, bgLum) >= minRatio) {
      return candidate;
    }
  }

  // Fallback: preto ou branco puro
  return bgLum > 0.5 ? "#000000" : "#FFFFFF";
}

// ---------------------------------------------------------------------------
// Resolver superfície de um card (gradiente + scrim)
// ---------------------------------------------------------------------------

export interface CardSurface {
  /** CSS final do background (pode incluir scrim) */
  background: string;
  /** Cor do título */
  titleText: string;
  /** Cor do corpo */
  bodyText: string;
  /** Cor de borda sugerida (opcional) */
  border?: string;
}

export function resolveCardSurface(
  gradientOrColor: string,
  pageBackground: string,
  options: { minContrast?: number; scrimStrength?: number } = {}
): CardSurface {
  void options.minContrast
  const { scrimStrength = 0.6 } = options
  void scrimStrength

  // Fundo da página: sólido ou média dos stops do gradiente
  let pageRgb: Rgb
  const directPage = parseColor(pageBackground)
  if (directPage) {
    pageRgb = { r: directPage.r, g: directPage.g, b: directPage.b, a: 1 }
  } else {
    const pageStops = extractGradientColors(pageBackground)
    if (pageStops.length > 0) {
      pageRgb = {
        r: pageStops.reduce((s, c) => s + c.r, 0) / pageStops.length,
        g: pageStops.reduce((s, c) => s + c.g, 0) / pageStops.length,
        b: pageStops.reduce((s, c) => s + c.b, 0) / pageStops.length,
        a: 1,
      }
    } else {
      pageRgb = { r: 10, g: 10, b: 10, a: 1 }
    }
  }
  const pageLum = relativeLuminance(pageRgb);

  // Extrai stops do gradiente ou cor
  const stops = extractGradientColors(gradientOrColor);
  const isGradient = stops.length > 0;

  if (!isGradient) {
    // Cor sólida: usa diretamente
    const bg = gradientOrColor;
    const text = contrastTextOn(bg);
    return {
      background: bg,
      titleText: text.title,
      bodyText: text.body,
      border: pageLum > 0.5 ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
    };
  }

  // Gradiente: compõe cada stop sobre o fundo da página e encontra o stop mais claro
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

  // Se o painel for claro, aplicamos um scrim escuro para garantir contraste
  const panelIsLight = maxLum > 0.45 || pageLum > 0.55;
  let finalBg = gradientOrColor;
  let finalLum = maxLum;

  if (panelIsLight) {
    const scrimAmount = Math.min(0.72, Math.max(0.35, maxLum * 0.85)) * 100;
    const scrim = `linear-gradient(rgba(0,0,0,${scrimAmount / 100}), rgba(0,0,0,${scrimAmount / 100}))`;
    finalBg = `${scrim}, ${gradientOrColor}`;
    // Recalcula luminância com scrim
    const scrimmed = compositeOver({ r: 0, g: 0, b: 0, a: scrimAmount / 100 }, maxSample);
    finalLum = relativeLuminance(scrimmed);
  }

  const titleText = finalLum > 0.5 ? "#0A0A0A" : "#FFFFFF";
  const bodyText = finalLum > 0.5 ? "rgba(10,10,10,0.75)" : "rgba(255,255,255,0.85)";

  // Se o fundo da página for claro, escurecemos a borda
  const border = pageLum > 0.5
    ? "rgba(0,0,0,0.2)"
    : "rgba(255,255,255,0.2)";

  return {
    background: finalBg,
    titleText,
    bodyText,
    border,
  };
}

// ---------------------------------------------------------------------------
// Derivar tema a partir do fundo da página (para títulos de seção, etc.)
// ---------------------------------------------------------------------------

export function deriveThemeFromBackground(pageBg: string): {
  primary: string;
  secondary: string;
  glow: string;
} {
  const bgRgb = parseColor(pageBg) ?? { r: 10, g: 10, b: 10, a: 1 };
  const bgLum = relativeLuminance(bgRgb);

  // Se fundo for claro, primária escura; senão, clara.
  const isLight = bgLum > 0.5;
  const primary = isLight ? "#0A0A0A" : "#FFFFFF";
  const secondary = isLight ? "rgba(10,10,10,0.7)" : "rgba(255,255,255,0.7)";
  const glow = isLight
    ? "rgba(0,0,0,0.08)"
    : "rgba(255,255,255,0.08)";

  return { primary, secondary, glow };
}

// ---------------------------------------------------------------------------
// Derivar gradiente de card a partir do tema
// ---------------------------------------------------------------------------

export function deriveCardGradientFromTheme(theme: {
  primary: string;
  secondary?: string;
}): string {
  const secondary = theme.secondary ?? theme.primary;
  // Tenta escurecer o secondary para ter um bom gradiente
  const darker = `color-mix(in oklch, ${secondary} 75%, black)`;
  return `linear-gradient(135deg, ${theme.primary} 0%, ${darker} 100%)`;
}

// ---------------------------------------------------------------------------
// Fundo efetivo da bio (unifica decisão)
// ---------------------------------------------------------------------------

export interface BioBackgroundInput {
  background?: string | null;
  backgroundPresetColor?: string | null;
  hasBackgroundImage?: boolean;
}

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

export interface PageChromeTokens {
  foreground: string
  mutedForeground: string
  card: string
  border: string
}

function backgroundLuminance(pageBackground: string): number {
  const direct = parseColor(pageBackground)
  if (direct) return relativeLuminance(direct)
  const stops = extractGradientColors(pageBackground)
  if (stops.length > 0) {
    return Math.max(...stops.map((stop) => relativeLuminance(stop)))
  }
  return 0
}

/**
 * Tokens de texto/card para fundo claro.
 * Em fundo escuro retorna null para manter o CSS padrão da bio.
 */
export function resolvePageChrome(pageBackground: string): PageChromeTokens | null {
  if (backgroundLuminance(pageBackground) <= 0.5) return null
  return {
    foreground: '#0A0A0A',
    mutedForeground: 'rgba(10,10,10,0.55)',
    card: '#ffffff',
    border: 'rgba(10,10,10,0.12)',
  }
}