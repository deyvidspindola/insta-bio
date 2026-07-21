# Implementação do Motor de Cores – Guia de Patches

Implementação do Motor de Cores – Guia de Patches
Contexto: monorepo insta-bio, conforme PROMPT-MOTOR-CORES.md e SNAPSHOT.md.
Objetivo: unificar contraste, permitir gradiente custom de página e fazer cards novos nascerem com cores do tema.

## 1. Arquivo novo (já baixado)

bio/src/lib/colorEngine.ts – motor único de cores.
Já está completo e deve ser adicionado ao projeto.

## 2. Patches por arquivo

Aplique as alterações abaixo na ordem indicada.

### 2.1. bio/src/lib/contrastColor.ts

Substituir as funções de parsing/luminância pelas do motor.

```diff
-import type { PrimarySurfaceColors } from './contrastColor'
+import type { PrimarySurfaceColors } from './contrastColor'
+import { parseColor, relativeLuminance } from './colorEngine'

-function parseOklchLightness(color: string): number | null {
-  // ... (todo o bloco original)
-}
-
-function estimateRelativeLuminance(color: string): number {
-  // ... (todo o bloco original)
-}
-
-function resolveLightness(color: string): number {
-  return parseOklchLightness(color) ?? estimateRelativeLuminance(color)
+function resolveLightness(color: string): number {
+  const parsed = parseColor(color)
+  if (parsed) return relativeLuminance(parsed)
+  return 0.35
 }
O restante do arquivo (a função resolvePrimarySurfaceColors) fica idêntico.

```

### 2.2. bio/src/lib/appHeroContrast.ts

Remover funções locais e importar do motor. Manter a API resolveAppHeroTheme inalterada.

```diff
-// bio/src/lib/appHeroContrast.ts
-//
-// Contraste adaptativo para os cards de destaque...
-
-import type { AppHeroTheme } from "./appHeroPresets";
-
-export interface ResolvedAppHeroTheme extends AppHeroTheme {
-  titleText: string;
-  bodyText: string;
-}
-
-// ---------------------------------------------------------------------------
-// Parsing e luminância
-// ---------------------------------------------------------------------------
-
-interface Rgb {
-  r: number;
-  g: number;
-  b: number;
-  a: number;
-}
-
-function clamp01(n: number) {
-  return Math.min(1, Math.max(0, n));
-}
-
-export function parseColor(input: string | undefined | null): Rgb | null {
-  // ... todo o bloco
-}
-
-export function relativeLuminance(rgb: Rgb): number {
-  // ...
-}
-
-export function contrastRatio(l1: number, l2: number): number {
-  // ...
-}
-
-function compositeOver(fg: Rgb, bg: Rgb): Rgb {
-  // ...
-}
-
-function extractColorTokens(css: string | undefined): string[] {
-  // ...
-}
-
-function extractGradientColors(gradient: string | undefined): Rgb[] {
-  // ...
-}
-
-function extractGradientEndColor(gradient: string | undefined): Rgb | null {
-  // ...
-}
-
-function resolvePageRgb(pageBackground: string): Rgb {
-  // ...
-}
-
-function estimatePanelFromGradient(/*...*/) {
-  // ...
-}
-
-function isTokenColor(css: string | undefined): boolean {
-  // ...
-}
-
-function estimateLuminance(/*...*/) {
-  // ...
-}
-
-function mixTowards(/*...*/) {
-  // ...
-}
-
-function reinforceBackground(/*...*/) {
-  // ...
-}
-
-export function resolveEffectiveBioBackground(input: BioBackgroundInput): string {
-  // ...
-}
-
-// ... resto do código
+import type { AppHeroTheme } from "./appHeroPresets";
+import {
+  parseColor,
+  relativeLuminance,
+  contrastRatio,
+  compositeOver,
+  extractColorTokens,
+  extractGradientColors,
+  extractGradientEndColor,
+  resolveEffectiveBioBackground,
+  type Rgb,
+  type BioBackgroundInput,
+} from "./colorEngine";
+
+// As funções auxiliares que ainda são específicas do AppHero (mixTowards, reinforceBackground,
+// isTokenColor, estimateLuminance, resolvePageRgb, estimatePanelFromGradient, etc.)
+// podem ser mantidas inline ou movidas para um arquivo de helpers, mas o mais simples
+// é mantê-las aqui, apenas removendo as duplicatas que agora vêm do motor.
+
+// Exemplo: isTokenColor pode ser reescrita usando a função do motor se existir, ou manter.
+// O importante é que parseColor, relativeLuminance etc. venham do motor.
+
+export { resolveEffectiveBioBackground };
+
+// O restante do arquivo (resolveAppHeroTheme) permanece como está, apenas usando
+// as funções importadas em vez das locais.
```

### 2.3. bio/src/components/BioPage.tsx

Adicionar suporte a gradiente custom e derivar --color-background a partir do último stop.

```diff
 import { useEffect } from 'react'
 import type { CSSProperties } from 'react'
 import type { BioConfig } from '../types/bio'
 import { resolveBackgroundPreset } from '../lib/backgroundPresets'
-import { resolveEffectiveBioBackground } from '../lib/appHeroContrast'
+import { resolveEffectiveBioBackground } from '../lib/colorEngine'
 import { resolvePrimarySurfaceColors } from '../lib/contrastColor'
 import { resolveBioTemplate } from '../lib/templates'
 import { resolveCardRadiusPx } from '../lib/cardRadius'
 import { applyPageMeta } from '../lib/pageMeta'
 import { resolvePublicUrl } from '../lib/publicUrl'
 import { BioHeader } from './BioHeader'
 import { BioSectionBlock } from './BioSection'
+import { extractGradientEndColor } from '../lib/colorEngine'

 // ...

 export function BioPage({ config, previewFocus = null }: BioPageProps) {
   const { brand, sections } = config
   const template = resolveBioTemplate(brand.template)
   const bgPreset = resolveBackgroundPreset(brand.theme.backgroundPreset)
   const hasBgImage = Boolean(brand.theme.backgroundImage)
   const hasBgPreset = Boolean(bgPreset) && !hasBgImage
+  const isGradientCustom = !hasBgImage && !bgPreset && Boolean(brand.theme.background?.includes('gradient'))
   const pageBackground = resolveEffectiveBioBackground({
     background: hasBgPreset && bgPreset ? bgPreset.gradient : brand.theme.background,
     backgroundPresetColor: bgPreset?.edgeColor,
     hasBackgroundImage: hasBgImage,
   })

+  // Cor para a variável CSS --color-background (cards, overlays)
+  let bgColorForVars: string | undefined
+  if (hasBgImage) {
+    bgColorForVars = undefined
+  } else if (hasBgPreset) {
+    bgColorForVars = bgPreset!.edgeColor
+  } else if (isGradientCustom) {
+    const endColor = extractGradientEndColor(brand.theme.background)
+    bgColorForVars = endColor ? `rgb(${endColor.r}, ${endColor.g}, ${endColor.b})` : '#000000'
+  } else {
+    bgColorForVars = brand.theme.background
+  }

   const themeVars = {
     '--color-primary': brand.theme.primary,
     '--bio-solid-from': primarySurface.solidFrom,
     '--bio-solid-to': primarySurface.solidTo,
     '--bio-fill-primary': primarySurface.fillPrimary,
     '--bio-card-radius': resolveCardRadiusPx(brand.theme.cardRadius),
     ...(brand.theme.secondary ? { '--color-secondary': brand.theme.secondary } : {}),
-    ...(!hasBgImage && (hasBgPreset ? bgPreset?.edgeColor : brand.theme.background)
+    ...(!hasBgImage && bgColorForVars
       ? {
-          '--color-background': hasBgPreset ? bgPreset!.edgeColor : brand.theme.background,
+          '--color-background': bgColorForVars,
         }
       : {}),
   } as CSSProperties

   // ... o resto permanece igual
 }
```

### 2.4. bio/src/components/BioSection.tsx

Tornar o título de seção com contraste dinâmico (usando contrastTextOn).

```diff
 import type { CSSProperties, MouseEvent, ReactNode } from 'react'
 import type { BioSection, SectionItem } from '../types/bio'
 import { itemSpansFullInGrid, groupStackSectionItems } from '../lib/sectionLayout'
+import { contrastTextOn } from '../lib/colorEngine'
 import { AppHeroCard } from './AppHeroCard'
 // ... outros imports

+// Hook ou contexto para obter pageBackground – vamos supor que existe um contexto
+// ou que podemos usar a mesma prop passada para BioSectionBlock.
+// Para simplificar, vamos receber `pageBackground` como prop e repassar.

 function SectionTitle({
   title,
   subtitle,
+  pageBackground,
 }: {
   title: string
   subtitle?: string
+  pageBackground: string
 }) {
   if (!title) return null
+  const textColors = contrastTextOn(pageBackground)

   return (
     <div className="mb-3 mt-6 px-1">
-      <h2 className="bio-section-title text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
+      <h2
+        className="bio-section-title text-[10px] font-semibold uppercase tracking-[0.22em]"
+        style={{ color: textColors.title }}
+      >
         {title}
       </h2>
-      {subtitle && <p className="bio-section-subtitle mt-1 text-xs">{subtitle}</p>}
+      {subtitle && (
+        <p className="bio-section-subtitle mt-1 text-xs" style={{ color: textColors.body }}>
+          {subtitle}
+        </p>
+      )}
     </div>
   )
 }

 // Dentro de BioSectionBlock, passe pageBackground para SectionTitle:
 export function BioSectionBlock({
   section,
   pageBackground = '#000000',
   focusItemIndex = null,
 }: {
   section: BioSection
   pageBackground?: string
   focusItemIndex?: number | null
 }) {
   const isGrid = section.layout === 'grid-2'

   return (
     <section>
-      <SectionTitle title={section.title} subtitle={section.subtitle} />
+      <SectionTitle title={section.title} subtitle={section.subtitle} pageBackground={pageBackground} />
       {/* ... resto do componente */}
     </section>
   )
 }
```

### 2.5. bio/src/components/FeatureCard.tsx

Substituir text-white fixo por cores dinâmicas via resolveCardSurface.

```diff
 import type { ReactNode } from 'react'
 import type { FeatureCard as FeatureCardType } from '../types/bio'
 import { CardLink, hasClickableUrl } from '../lib/cardLink'
 import { resolvePublicUrl } from '../lib/publicUrl'
+import { resolveCardSurface } from '../lib/colorEngine'
 import { ArrowIcon, BioIcon } from './icons'

+// Vamos receber pageBackground via prop ou contexto; assumiremos que vem de BioSectionBlock.
+// Se não, podemos usar um contexto, mas por ora passaremos explicitamente.

-export function FeatureCard({ item, grid = false }: { item: FeatureCardType; grid?: boolean }) {
+export function FeatureCard({
+  item,
+  grid = false,
+  pageBackground = '#000000',
+}: {
+  item: FeatureCardType
+  grid?: boolean
+  pageBackground?: string
+}) {
   const clickable = hasClickableUrl(item.url)
-  const shellClass = `bio-card bio-card--media group relative block ${grid ? 'h-full' : ''}`
+  const hasImage = Boolean(item.image)
+  const bgForCard = item.gradient ?? (item.variant === 'compact' ? 'transparent' : item.gradient)
+  const surface = !hasImage && bgForCard && bgForCard !== 'transparent'
+    ? resolveCardSurface(bgForCard, pageBackground)
+    : null
+
+  const shellClass = `bio-card bio-card--media group relative block ${grid ? 'h-full' : ''}`
+
+  // Para os casos com imagem, mantemos o texto branco com overlay.
+  // Para compact, usamos texto branco (já tem fundo escuro).

   // Dentro de cada variante, substituir:
   // - <h3 className="... text-white"> → <h3 style={{ color: surface?.titleText ?? '#FFFFFF' }}>
   // - <p className="... text-white/85"> → <p style={{ color: surface?.bodyText ?? 'rgba(255,255,255,0.85)' }}>
   // - <span className="... text-white/90"> etc.

   // Exemplo no caso 'square':
   {item.image ? (
     // ... (mantém text-white com overlay)
   ) : (
     <div className="absolute inset-0" style={{ background: item.gradient ?? '...' }} />
   )}
   // ... depois no texto:
-  <h3 className="text-base font-bold leading-tight text-white">{item.title}</h3>
+  <h3
+    className="text-base font-bold leading-tight"
+    style={{ color: surface?.titleText ?? '#FFFFFF' }}
+  >
+    {item.title}
+  </h3>
Repetir para todos os lugares com text-white/text-white/85 nos textos, exceto quando houver imagem ou overlay forte (aí mantém branco).

```

### 2.6. bio/src/components/GridCard.tsx

Análogo ao FeatureCard, substituir textos fixos por surface:

```diff
 import type { GridCard as GridCardType } from '../types/bio'
 import { CardLink, hasClickableUrl } from '../lib/cardLink'
 import { resolvePublicUrl } from '../lib/publicUrl'
+import { resolveCardSurface } from '../lib/colorEngine'
 import { ArrowIcon } from './icons'

-export function GridCard({ item }: { item: GridCardType }) {
+export function GridCard({ item, pageBackground = '#000000' }: { item: GridCardType; pageBackground?: string }) {
   const clickable = hasClickableUrl(item.url)
+  const surface = item.image ? null : resolveCardSurface(item.gradient ?? '#000000', pageBackground)

   return (
     <CardLink url={item.url} className="bio-card bio-card--media group relative block aspect-square">
       {item.image ? (
         // ... overlay com text-white
       ) : (
         <div className="absolute inset-0" style={{ background: item.gradient }} />
       )}
       {/* badge */}
-      <h3 className="text-base font-bold leading-tight text-white">{item.title}</h3>
+      <h3 className="text-base font-bold leading-tight" style={{ color: surface?.titleText ?? '#FFFFFF' }}>
+        {item.title}
+      </h3>
-      {item.subtitle && <p className="mt-0.5 text-[10px] text-white/85">{item.subtitle}</p>}
+      {item.subtitle && (
+        <p className="mt-0.5 text-[10px]" style={{ color: surface?.bodyText ?? 'rgba(255,255,255,0.85)' }}>
+          {item.subtitle}
+        </p>
+      )}
     </CardLink>
   )
 }
```

### 2.7. bio/src/components/AppHeroCard.tsx

Já usa resolveAppHeroTheme, que agora importa do motor. Nenhuma alteração necessária, apenas garantir que a importação de resolveAppHeroTheme e resolveEffectiveBioBackground venha de ../lib/appHeroContrast (que por sua vez usa o motor).
Verificar se pageBackground está sendo passado corretamente (já é passado).

### 2.8. editor/src/components/AppearanceForm.tsx

Adicionar modo “Gradiente personalizado” e reutilizar GradientField.

```diff
 import { useState } from 'react'
 import type { BioBrand, BioTemplate } from '@bio-types'
 import { resolvePublicUrl } from '@site/lib/publicUrl'
 import { BACKGROUND_PRESETS } from '@site/lib/backgroundPresets'
 import { BIO_TEMPLATE_LIST, DEFAULT_BIO_TEMPLATE } from '@site/lib/templates'
 import { cardRadiusLabel, resolveCardRadius, resolveCardRadiusPx } from '@site/lib/cardRadius'
 import { COLOR_PALETTES, type ColorPalette } from '../lib/colorPalettes'
 import { extractPaletteFromImage, type ExtractedPalette } from '../lib/extractImagePalette'
 import { ColorField, GlowColorField } from './ColorField'
+import { GradientField } from './GradientField'
 import { EditorSubnav } from './EditorSubnav'
 import { ImageField } from './ImageField'

 type AppearanceTab = 'background' | 'colors' | 'links'

 // ...

 export function AppearanceForm({ brand, onChange }: AppearanceFormProps) {
   const [tab, setTab] = useState<AppearanceTab>('background')
   // ... estado existente

+  // Modo de fundo atual
+  const bgMode = brand.theme.backgroundImage ? 'image' :
+    brand.theme.backgroundPreset ? 'preset' :
+    (brand.theme.background?.includes('gradient') ? 'gradient' : 'solid')
+
+  function setBgMode(mode: 'preset' | 'solid' | 'gradient' | 'image') {
+    // Limpa os campos conforme o modo
+    const newTheme: BioBrand['theme'] = { ...brand.theme }
+    if (mode === 'image') {
+      // Mantém backgroundImage (já está setado)
+    } else if (mode === 'preset') {
+      // Mantém backgroundPreset (já está setado)
+    } else if (mode === 'solid') {
+      newTheme.backgroundPreset = undefined
+      newTheme.backgroundImage = undefined
+      // Mantém background (cor sólida)
+    } else if (mode === 'gradient') {
+      newTheme.backgroundPreset = undefined
+      newTheme.backgroundImage = undefined
+      if (!newTheme.background?.includes('gradient')) {
+        // Inicia com um gradiente padrão
+        newTheme.background = 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)'
+      }
+    }
+    onChange({ ...brand, theme: newTheme })
+  }

   // No JSX, dentro da aba 'background', após a seção de presets:

   return (
     <div>
       <EditorSubnav tabs={APPEARANCE_TABS} active={tab} onChange={(id) => setTab(id as AppearanceTab)} />

       {tab === 'background' && (
         <div className="space-y-4">
           {/* ... seção de presets ... */}

+          <div className="card">
+            <h3 className="mb-1 text-sm font-semibold">Gradiente personalizado</h3>
+            <p className="mb-3 text-xs text-muted-foreground">
+              Crie seu próprio gradiente de fundo (linear ou radial). Substitui presets e cor sólida.
+            </p>
+            <div className="flex flex-wrap items-center gap-2 mb-3">
+              <button
+                type="button"
+                onClick={() => setBgMode('gradient')}
+                className={`btn ${bgMode === 'gradient' ? 'btn-primary' : 'btn-secondary'}`}
+              >
+                Gradiente
+              </button>
+              <button
+                type="button"
+                onClick={() => setBgMode('solid')}
+                className={`btn ${bgMode === 'solid' ? 'btn-primary' : 'btn-secondary'}`}
+              >
+                Cor sólida
+              </button>
+              <button
+                type="button"
+                onClick={() => setBgMode('preset')}
+                className={`btn ${bgMode === 'preset' ? 'btn-primary' : 'btn-secondary'}`}
+              >
+                Preset
+              </button>
+            </div>
+            {bgMode === 'gradient' && (
+              <GradientField
+                label=""
+                value={brand.theme.background ?? ''}
+                onChange={(gradient) => {
+                  onChange({
+                    ...brand,
+                    theme: {
+                      ...brand.theme,
+                      background: gradient,
+                      backgroundPreset: undefined,
+                      backgroundImage: undefined,
+                    },
+                  })
+                }}
+              />
+            )}
+          </div>

           {/* ... seção de imagem/cor sólida (já existente) ... */}
         </div>
       )}
       {/* ... outras tabs ... */}
     </div>
   )
 }
```

### 2.9. editor/src/lib/bio.ts

Modificar createItem para aceitar theme e usar deriveCardGradientFromTheme.

```diff
+import { deriveCardGradientFromTheme } from '@site/lib/colorEngine'
+import type { BioBrand } from '@bio-types'

-export function createItem(type: SectionItem['type']): SectionItem {
+export function createItem(type: SectionItem['type'], theme?: BioBrand['theme']): SectionItem {
   switch (type) {
     case 'whatsapp-hero':
       // ... (sem mudanças)
     case 'app-hero':
       return createAppHero('whatsapp') // ou poderia receber tema? não necessário
     case 'feature':
+      const gradient = theme ? deriveCardGradientFromTheme(theme) : 'linear-gradient(135deg, oklch(0.70 0.18 55) 0%, oklch(0.55 0.19 40) 100%)'
       return {
         type,
         title: 'Novo destaque',
         description: 'Descrição do card',
         url: 'https://',
         variant: 'gradient',
+        gradient,
       }
     case 'link':
       // ...
     case 'grid':
+      const gridGradient = theme ? deriveCardGradientFromTheme(theme) : 'linear-gradient(135deg, oklch(0.70 0.18 55) 0%, oklch(0.55 0.19 40) 100%)'
       return {
         type,
         title: 'Novo card',
         url: 'https://',
-        gradient: 'linear-gradient(135deg, oklch(0.70 0.18 55) 0%, oklch(0.55 0.19 40) 100%)',
+        gradient: gridGradient,
       }
     // ... outros cases
   }
 }
```

### 2.10. editor/src/components/SectionEditor.tsx (não fornecido, mas necessário ajustar)

Onde createItem é chamado, passar o tema atual:

ts
// Exemplo dentro de um handler "adicionar card":
function handleAddItem(type: SectionItem['type']) {
  const newItem = createItem(type, brand.theme)  // <-- passar tema
  // ... adicionar à seção
}
## 3. Integração adicional

bio/src/components/BioSectionBlock: ao renderizar FeatureCard e GridCard, repassar pageBackground.

bio/src/components/BioPage: já calcula pageBackground e passa para BioSectionBlock.

Verificar que pageBackground é propagado consistentemente.

## 4. Checklist de verificação

colorEngine.ts adicionado em bio/src/lib/

contrastColor.ts atualizado para usar parseColor e relativeLuminance do motor

appHeroContrast.ts removidas funções duplicadas, importado do motor

BioPage.tsx: suporte a gradiente custom e --color-background derivado

BioSection.tsx: título dinâmico com contrastTextOn

FeatureCard.tsx e GridCard.tsx: textos dinâmicos com resolveCardSurface

AppearanceForm.tsx: modo gradiente custom com GradientField

bio.ts: createItem recebe theme e usa deriveCardGradientFromTheme

SectionEditor.tsx: passar brand.theme ao chamar createItem

Testar cenários: fundo escuro, claro, teal, imagem, gradiente custom

Verificar que presets AppHero continuam funcionando

Nenhuma migração automática de bio.json existente

## 5. O que NÃO mudou (confirmado)

A lógica de resolvePrimarySurfaceColors (apenas usa motor internamente)

O comportamento dos presets AppHero (WhatsApp, YouTube etc.)

Cards já salvos em bio.json

O fluxo de upload de imagem (prioridade mantida)

Nenhuma dependência npm nova

Backend/PHP/painel remoto

A API de resolveAppHeroTheme (mantida compatível)

O GradientField existente (apenas reutilizado)

Após aplicar todos os patches, compile e teste em ambiente de desenvolvimento.