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
        </div>
      )}

      {tab === 'colors' && (
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
