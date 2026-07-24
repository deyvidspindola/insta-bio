import { useEffect, useState } from 'react'
import type { BioBrand, BioConfig, BioSection, BioTemplate } from '@bio-types'
import { resolvePublicUrl } from '@site/lib/publicUrl'
import { BACKGROUND_PRESETS } from '@site/lib/backgroundPresets'
import { BIO_TEMPLATE_LIST, DEFAULT_BIO_TEMPLATE } from '@site/lib/templates'
import {
  CARD_RADIUS_PRESETS,
  cardRadiusLabel,
  resolveCardRadius,
  resolveCardRadiusPx,
} from '@site/lib/cardRadius'
import {
  THEME_PACKS,
  applyBlankThemeToBrand,
  applySnapshotToConfig,
  applySnapshotVisualOnly,
  applyThemePackToBrand,
  applyThemePackToConfig,
  extractThemeSnapshot,
  type ThemePack,
} from '@site/lib/themePacks'
import { COLOR_PALETTES, type ColorPalette } from '../lib/colorPalettes'
import { extractPaletteFromImage, type ExtractedPalette } from '../lib/extractImagePalette'
import { isStarterBio } from '../lib/bio'
import {
  deleteSavedThemePack,
  listSavedThemePacks,
  saveThemePack,
  type SavedThemePack,
} from '../lib/savedThemes'
import { ColorField, GlowColorField } from './ColorField'
import { GradientField } from './GradientField'
import { EditorSubnav } from './EditorSubnav'
import { ImageField } from './ImageField'
import { TemplateCard } from './TemplateCard'
import { ConfirmDialog } from './ConfirmDialog'

type AppearanceMode = 'templates' | 'customize'

const DEFAULT_CUSTOM_GRADIENT = 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)'
const DEFAULT_OVERLAY = 0.55

const MODE_TABS = [
  { id: 'templates' as const, label: 'Templates prontos' },
  { id: 'customize' as const, label: 'Personalizar' },
]

interface AppearanceFormProps {
  brand: BioBrand
  sections: BioSection[]
  onChange: (brand: BioBrand) => void
  onChangeConfig: (config: BioConfig) => void
}

export function AppearanceForm({
  brand,
  sections,
  onChange,
  onChangeConfig,
}: AppearanceFormProps) {
  const [mode, setMode] = useState<AppearanceMode>('templates')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [imagePalette, setImagePalette] = useState<ExtractedPalette | null>(null)
  const [saved, setSaved] = useState<SavedThemePack[]>(() => listSavedThemePacks())
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveCategory, setSaveCategory] = useState('Personalizado')
  const [blankConfirmOpen, setBlankConfirmOpen] = useState(false)
  const [pendingPack, setPendingPack] = useState<ThemePack | null>(null)
  const [pendingSaved, setPendingSaved] = useState<SavedThemePack | null>(null)
  const [useGradientBg, setUseGradientBg] = useState(() =>
    Boolean(brand.theme.background?.includes('gradient') && !brand.theme.backgroundImage),
  )

  const activeTemplate = brand.template ?? DEFAULT_BIO_TEMPLATE
  const hasBgImage = Boolean(brand.theme.backgroundImage)
  const activeBgPreset = brand.theme.backgroundPreset
  const cardRadius = resolveCardRadius(brand.theme.cardRadius)
  const cardRadiusPx = resolveCardRadiusPx(brand.theme.cardRadius)
  const overlayOpacity = brand.theme.backgroundOverlayOpacity ?? DEFAULT_OVERLAY
  const overlayPercent = Math.round(overlayOpacity * 100)
  const canReplaceContent = isStarterBio({ brand, sections })
  const applyMode = canReplaceContent ? 'full' : 'visual'

  useEffect(() => {
    setSaved(listSavedThemePacks())
  }, [])

  useEffect(() => {
    if (hasBgImage) return
    setUseGradientBg(Boolean(brand.theme.background?.includes('gradient')))
  }, [brand.theme.background, hasBgImage])

  function touchBrand(next: BioBrand) {
    onChange({ ...next, activeTemplateId: undefined })
  }

  function setTemplate(template: BioTemplate) {
    onChange({ ...brand, template, activeTemplateId: undefined })
  }

  function applyThemeColors(colors: { primary: string; secondary: string; glow: string }) {
    touchBrand({
      ...brand,
      theme: {
        ...brand.theme,
        primary: colors.primary,
        secondary: colors.secondary,
        glow: colors.glow,
      },
    })
  }

  /** Paleta de nicho: só cores do sistema (não trava o fundo). */
  function applyPalette(palette: ColorPalette) {
    touchBrand({
      ...brand,
      theme: {
        ...brand.theme,
        primary: palette.primary,
        secondary: palette.secondary,
        glow: palette.glow,
      },
    })
  }

  /** Atalho de fundo: só o fundo — não sobrescreve as cores. */
  function applyBackgroundOnly(presetId: string) {
    const preset = BACKGROUND_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    touchBrand({
      ...brand,
      theme: {
        ...brand.theme,
        backgroundPreset: presetId,
        backgroundImage: undefined,
        background: preset.edgeColor,
      },
    })
    setUseGradientBg(false)
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
      touchBrand({
        ...baseBrand,
        theme: {
          ...baseBrand.theme,
          primary: palette.primary,
          secondary: palette.secondary,
          glow: palette.glow,
        },
      })
    } catch {
      setExtractError('Não foi possível ler as cores da imagem.')
    } finally {
      setExtracting(false)
    }
  }

  function requestApplyPack(pack: ThemePack) {
    setPendingSaved(null)
    setPendingPack(pack)
  }

  function requestApplySaved(item: SavedThemePack) {
    setPendingPack(null)
    setPendingSaved(item)
  }

  function confirmApplyTemplate() {
    if (pendingPack) {
      if (canReplaceContent) {
        onChangeConfig(applyThemePackToConfig({ brand, sections }, pendingPack))
      } else {
        onChange(applyThemePackToBrand(brand, pendingPack))
      }
      setPendingPack(null)
      return
    }
    if (pendingSaved) {
      if (canReplaceContent) {
        onChangeConfig(
          applySnapshotToConfig({ brand, sections }, pendingSaved.snapshot, pendingSaved.id),
        )
      } else {
        onChange(applySnapshotVisualOnly(brand, pendingSaved.snapshot, pendingSaved.id))
      }
      setPendingSaved(null)
    }
  }

  function handleSaveCurrent() {
    saveThemePack({
      name: saveName,
      category: saveCategory,
      snapshot: extractThemeSnapshot(brand, sections),
    })
    setSaveOpen(false)
    setSaveName('')
    setSaved(listSavedThemePacks())
  }

  function confirmBlankTheme() {
    onChange(applyBlankThemeToBrand(brand))
    setBlankConfirmOpen(false)
    setMode('customize')
    setUseGradientBg(false)
  }

  return (
    <div>
      <EditorSubnav
        tabs={MODE_TABS}
        active={mode}
        onChange={(id) => setMode(id as AppearanceMode)}
      />

      {mode === 'templates' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 text-xs"
              onClick={() => setBlankConfirmOpen(true)}
            >
              + Criar do zero
            </button>
            <button
              type="button"
              className="btn-primary px-3 py-1.5 text-xs"
              onClick={() => setSaveOpen(true)}
            >
              Salvar meu template
            </button>
          </div>

          {saveOpen && (
            <div className="card space-y-3 border-primary/30">
              <h3 className="text-sm font-semibold">Salvar como novo template</h3>
              <p className="text-[11px] text-muted-foreground">
                Salva visual + cards/links atuais para reutilizar depois.
              </p>
              <div className="field">
                <label>Nome</label>
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Ex.: Meu Estilo Médica Gold"
                />
              </div>
              <div className="field">
                <label>Categoria</label>
                <input
                  value={saveCategory}
                  onChange={(e) => setSaveCategory(e.target.value)}
                  placeholder="Personalizado"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-primary text-xs" onClick={handleSaveCurrent}>
                  Salvar
                </button>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setSaveOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {saved.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Meus templates</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {saved.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        className="btn-primary px-2 py-1 text-[10px]"
                        onClick={() => requestApplySaved(item)}
                      >
                        Aplicar
                      </button>
                      <button
                        type="button"
                        className="btn-secondary px-2 py-1 text-[10px]"
                        onClick={() => {
                          deleteSavedThemePack(item.id)
                          setSaved(listSavedThemePacks())
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-1 text-sm font-semibold">Bios-modelo da plataforma</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              {canReplaceContent
                ? 'Bio nova: ao usar um template, aplica visual e cards sugestivos. Depois edite textos e URLs na aba Conteúdo.'
                : 'Sua bio já tem conteúdo: os templates aplicam só o visual (cores, fundo e estilo dos links). Cards e textos permanecem.'}
            </p>
            <div className="grid grid-cols-2 items-stretch gap-3 lg:grid-cols-4">
              {THEME_PACKS.map((pack) => (
                <TemplateCard
                  key={pack.id}
                  pack={pack}
                  active={brand.activeTemplateId === pack.id}
                  brandName={brand.name}
                  logoUrl={brand.logo}
                  applyLabel={applyMode === 'full' ? 'Usar esta bio' : 'Aplicar visual'}
                  onApply={() => requestApplyPack(pack)}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {mode === 'customize' && (
        <div className="space-y-6">
          {/* ——— Seção 1: Página ——— */}
          <section className="card space-y-4">
            <div>
              <h3 className="text-sm font-semibold">1. Fundo da página</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Foto, cor sólida ou gradiente. Os atalhos abaixo só mudam o fundo — suas cores
                permanecem.
              </p>
            </div>

            <ImageField
              label="Foto de fundo (opcional)"
              value={brand.theme.backgroundImage}
              onChange={(backgroundImage) => {
                const nextBrand: BioBrand = {
                  ...brand,
                  activeTemplateId: undefined,
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
            />

            {hasBgImage && (
              <div className="space-y-2 rounded-lg border border-border bg-background/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium">Escurecimento da foto</label>
                  <span className="text-[10px] text-muted-foreground">{overlayPercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={overlayPercent}
                  onChange={(e) =>
                    touchBrand({
                      ...brand,
                      theme: {
                        ...brand.theme,
                        backgroundOverlayOpacity: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className="color-opacity-slider w-full"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="btn-secondary px-2.5 py-1 text-[10px]"
                    disabled={extracting}
                    onClick={() => suggestColorsFromBackground()}
                  >
                    {extracting ? 'Analisando…' : 'Sugerir cores da foto'}
                  </button>
                  {imagePalette && (
                    <button
                      type="button"
                      className="btn-secondary px-2.5 py-1 text-[10px]"
                      onClick={() => applyThemeColors(imagePalette)}
                    >
                      Reaplicar sugestão
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-[10px] text-muted-foreground underline"
                    onClick={() =>
                      touchBrand({
                        ...brand,
                        theme: { ...brand.theme, backgroundImage: undefined },
                      })
                    }
                  >
                    Remover foto
                  </button>
                </div>
                {extractError && <p className="text-[10px] text-red-400">{extractError}</p>}
              </div>
            )}

            {!hasBgImage && (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`btn-secondary flex-1 py-1.5 text-xs ${
                      !useGradientBg ? 'border-primary ring-1 ring-primary/35' : ''
                    }`}
                    onClick={() => {
                      setUseGradientBg(false)
                      touchBrand({
                        ...brand,
                        theme: {
                          ...brand.theme,
                          backgroundPreset: undefined,
                          background: brand.theme.background?.includes('gradient')
                            ? '#0a0a0a'
                            : brand.theme.background,
                        },
                      })
                    }}
                  >
                    Cor sólida
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary flex-1 py-1.5 text-xs ${
                      useGradientBg ? 'border-primary ring-1 ring-primary/35' : ''
                    }`}
                    onClick={() => {
                      setUseGradientBg(true)
                      touchBrand({
                        ...brand,
                        theme: {
                          ...brand.theme,
                          backgroundPreset: undefined,
                          background: brand.theme.background?.includes('gradient')
                            ? brand.theme.background
                            : DEFAULT_CUSTOM_GRADIENT,
                        },
                      })
                    }}
                  >
                    Gradiente
                  </button>
                </div>

                {useGradientBg ? (
                  <GradientField
                    label="Gradiente personalizado"
                    value={brand.theme.background ?? DEFAULT_CUSTOM_GRADIENT}
                    onChange={(gradient) =>
                      touchBrand({
                        ...brand,
                        theme: {
                          ...brand.theme,
                          background: gradient,
                          backgroundPreset: undefined,
                        },
                      })
                    }
                  />
                ) : (
                  <ColorField
                    label="Cor de fundo"
                    value={
                      brand.theme.background?.includes('gradient')
                        ? ''
                        : (brand.theme.background ?? '')
                    }
                    onChange={(background) =>
                      touchBrand({
                        ...brand,
                        theme: {
                          ...brand.theme,
                          background: background || undefined,
                          backgroundPreset: undefined,
                        },
                      })
                    }
                    hint="Livre — qualquer cor. Vazio = fundo escuro padrão."
                  />
                )}

                <div>
                  <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                    Atalhos de fundo (opcional)
                  </p>
                  <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
                    {BACKGROUND_PRESETS.map((preset) => {
                      const selected = activeBgPreset === preset.id
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          title={`${preset.name} — só altera o fundo`}
                          onClick={() => applyBackgroundOnly(preset.id)}
                          className={`aspect-square overflow-hidden rounded-lg border transition-transform hover:scale-[1.04] ${
                            selected
                              ? 'border-primary ring-2 ring-primary/40'
                              : 'border-border/80'
                          }`}
                        >
                          <span
                            className="block h-full w-full"
                            style={{ background: preset.gradient }}
                          />
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                    Não altera primária nem estilo dos links — só o pano de fundo.
                  </p>
                </div>
              </>
            )}
          </section>

          {/* ——— Seção 2: Cores + links ——— */}
          <section className="card space-y-5">
            <div>
              <h3 className="text-sm font-semibold">2. Cores e estilo dos links</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Defina a identidade da marca e como os botões de link aparecem.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold">Paletas por nicho</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => applyPalette(palette)}
                    className="group overflow-hidden rounded-xl border border-border bg-background/40 text-left transition-colors hover:border-primary/50"
                  >
                    <span
                      className="block h-12 w-full"
                      style={{ background: palette.swatch }}
                    />
                    <span className="flex items-center justify-between gap-2 px-2.5 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold">{palette.name}</span>
                        {palette.tag && (
                          <span className="block text-[10px] text-muted-foreground">
                            {palette.tag}
                          </span>
                        )}
                      </span>
                      <span className="flex shrink-0 gap-0.5">
                        {[palette.primary, palette.secondary].map((c, i) => (
                          <span
                            key={i}
                            className="size-3 rounded-full border border-border"
                            style={{ background: c }}
                          />
                        ))}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                Aplica primária, secundária e brilho. O fundo da página não muda.
              </p>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold">Cores do sistema</p>
              <ColorField
                label="Primária"
                value={brand.theme.primary}
                onChange={(primary) =>
                  touchBrand({ ...brand, theme: { ...brand.theme, primary } })
                }
                hint="Botões, títulos e destaques"
              />
              <ColorField
                label="Secundária"
                value={brand.theme.secondary ?? ''}
                onChange={(secondary) =>
                  touchBrand({
                    ...brand,
                    theme: { ...brand.theme, secondary: secondary || undefined },
                  })
                }
              />
              <GlowColorField
                label="Brilho (glow)"
                value={brand.theme.glow ?? ''}
                onChange={(glow) =>
                  touchBrand({
                    ...brand,
                    theme: { ...brand.theme, glow: glow || undefined },
                  })
                }
              />
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold">Formato dos links</p>
              <p className="text-[10px] text-muted-foreground">
                Vale para Link simples e Localização.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BIO_TEMPLATE_LIST.map((item) => {
                  const selected = activeTemplate === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTemplate(item.id)}
                      className={`rounded-xl border p-2.5 text-left ${
                        selected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                          : 'border-border bg-background/40 hover:border-primary/40'
                      }`}
                    >
                      <div className={`bio-tpl-preview ${item.previewClass} mb-1.5`}>
                        <span />
                        <span />
                        <span />
                      </div>
                      <span className="block text-xs font-semibold">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold">Arredondamento</p>
                <span className="text-[10px] text-muted-foreground">
                  {cardRadiusLabel(cardRadius)} · {cardRadiusPx}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {CARD_RADIUS_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      touchBrand({
                        ...brand,
                        theme: { ...brand.theme, cardRadius: preset.value },
                      })
                    }
                    className={`flex h-10 items-center justify-center border text-[10px] font-medium ${
                      cardRadius === preset.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background/40'
                    }`}
                    style={{ borderRadius: `${preset.px}px` }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={cardRadius}
                onChange={(e) =>
                  touchBrand({
                    ...brand,
                    theme: { ...brand.theme, cardRadius: Number(e.target.value) },
                  })
                }
                className="color-opacity-slider w-full"
              />
            </div>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingPack || pendingSaved)}
        title={canReplaceContent ? 'Usar esta bio-modelo?' : 'Aplicar só o visual?'}
        description={
          canReplaceContent ? (
            <>
              Sua bio ainda está no início. Isso aplica o visual e{' '}
              <strong>monta os cards/links sugestivos</strong> do template.
              <br />
              <span className="mt-2 block text-muted-foreground">
                Nome, logo e Instagram são mantidos. Depois você edita textos e URLs na aba
                Conteúdo.
              </span>
            </>
          ) : (
            <>
              Sua bio já tem conteúdo próprio. Isso aplica{' '}
              <strong>apenas o visual</strong> do template (cores, fundo e estilo dos links).
              <br />
              <span className="mt-2 block text-muted-foreground">
                Cards, textos e URLs atuais <strong>não serão alterados</strong>.
              </span>
            </>
          )
        }
        confirmLabel={canReplaceContent ? 'Usar esta bio' : 'Aplicar visual'}
        cancelLabel="Cancelar"
        onConfirm={confirmApplyTemplate}
        onCancel={() => {
          setPendingPack(null)
          setPendingSaved(null)
        }}
      />

      <ConfirmDialog
        open={blankConfirmOpen}
        title="Criar tema do zero?"
        description="Deseja resetar o tema para um estilo limpo e neutro? Em seguida você personaliza fundo, cores e links. Os cards atuais não são apagados."
        confirmLabel="Resetar e personalizar"
        cancelLabel="Cancelar"
        onConfirm={confirmBlankTheme}
        onCancel={() => setBlankConfirmOpen(false)}
      />
    </div>
  )
}
