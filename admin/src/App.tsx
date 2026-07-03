import { useEffect, useRef, useState } from 'react'
import {
  Braces,
  Copy,
  Download,
  Images,
  Layers,
  LogOut,
  Moon,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Redo2,
  Save,
  Smartphone,
  Sun,
  Undo2,
  Upload,
} from 'lucide-react'
import type { BioConfig } from '@bio-types'
import { BrandForm } from './components/BrandForm'
import { ImagesGallery } from './components/ImagesGallery'
import { JsonPanel } from './components/JsonPanel'
import { LoginScreen } from './components/LoginScreen'
import { PreviewPanel } from './components/PreviewPanel'
import { SectionEditor } from './components/SectionEditor'
import { fetchSession, logout, saveBioConfig } from './lib/auth'
import {
  copyBioConfig,
  createDefaultConfig,
  createSection,
  downloadBioConfig,
  loadBioConfig,
} from './lib/bio'
import { applyTheme, getStoredTheme, type Theme } from './lib/theme'

type Tab = 'brand' | 'sections' | 'images' | 'json' | 'preview'

const HISTORY_LIMIT = 50

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [config, setConfig] = useState<BioConfig | null>(null)
  const [past, setPast] = useState<BioConfig[]>([])
  const [future, setFuture] = useState<BioConfig[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('brand')
  const [activeSection, setActiveSection] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())
  const [railExpanded, setRailExpanded] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moreOpen) return
    function onClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [moreOpen])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  // Grava uma edição no histórico (para desfazer/refazer) e aplica o novo estado.
  function commit(next: BioConfig) {
    if (config) setPast((p) => [...p.slice(-(HISTORY_LIMIT - 1)), config])
    setFuture([])
    setConfig(next)
  }

  // Define a configuração sem registrar histórico (carga inicial, importação).
  function resetConfig(next: BioConfig) {
    setPast([])
    setFuture([])
    setConfig(next)
  }

  function undo() {
    if (!past.length || !config) return
    const previous = past[past.length - 1]
    setPast((p) => p.slice(0, -1))
    setFuture((f) => [config, ...f])
    setConfig(previous)
  }

  function redo() {
    if (!future.length || !config) return
    const next = future[0]
    setFuture((f) => f.slice(1))
    setPast((p) => [...p, config])
    setConfig(next)
  }

  function reorderSections(from: number, to: number) {
    if (!config || from === to) return
    const sections = [...config.sections]
    const [moved] = sections.splice(from, 1)
    sections.splice(to, 0, moved)
    commit({ ...config, sections })

    // mantém selecionada a seção que estava ativa
    if (activeSection === from) setActiveSection(to)
    else if (from < activeSection && to >= activeSection) setActiveSection(activeSection - 1)
    else if (from > activeSection && to <= activeSection) setActiveSection(activeSection + 1)
  }

  useEffect(() => {
    fetchSession()
      .then((session) => setAuthenticated(session.authenticated))
      .catch(() => setAuthenticated(false))
  }, [])

  useEffect(() => {
    if (!authenticated) return
    loadBioConfig()
      .then((data) => {
        resetConfig(data)
        setStatus('Configuração carregada')
        window.setTimeout(() => setStatus(null), 3000)
      })
      .catch((err: Error) => setError(err.message))
  }, [authenticated])

  async function handleLogout() {
    await logout()
    setAuthenticated(false)
    setConfig(null)
  }

  function showStatus(message: string) {
    setStatus(message)
    window.setTimeout(() => setStatus(null), 3000)
  }

  async function handleCopy() {
    if (!config) return
    await copyBioConfig(config)
    showStatus('JSON copiado para a área de transferência')
  }

  function handleDownload() {
    if (!config) return
    downloadBioConfig(config)
    showStatus('bio.json baixado — substitua em public/bio.json')
  }

  async function handleSave() {
    if (!config) return
    try {
      await saveBioConfig(config)
      showStatus('bio.json salvo no servidor')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  function handleImport(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as BioConfig
        resetConfig(parsed)
        setActiveSection(0)
        showStatus('JSON importado com sucesso')
      } catch {
        setError('Arquivo JSON inválido')
      }
    }
    reader.readAsText(file)
  }

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!authenticated) {
    return <LoginScreen onSuccess={() => setAuthenticated(true)} />
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const railTabs: { id: Tab; label: string; icon: typeof Palette; mobileOnly?: boolean }[] = [
    { id: 'brand', label: 'Marca', icon: Palette },
    { id: 'sections', label: 'Seções', icon: Layers },
    { id: 'images', label: 'Imagens', icon: Images },
    { id: 'json', label: 'JSON', icon: Braces },
    { id: 'preview', label: 'Preview', icon: Smartphone, mobileOnly: true },
  ]

  const isDark = theme === 'dark'

  return (
    <div className="min-h-screen">
      {/* Header fixo no topo, ocupando toda a largura */}
      <header className="editor-topbar fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-x-3 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}logo-instabio.svg`}
            alt="insta-bio"
            className="h-9 w-9 shrink-0 rounded-lg shadow-sm"
            title="insta-bio"
          />
          <div className="hidden leading-tight sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              insta-bio
            </p>
            <h1 className="text-sm font-semibold text-white">Editor da Bio</h1>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            className="topbar-btn"
            onClick={undo}
            disabled={past.length === 0}
            title="Desfazer"
            aria-label="Desfazer"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="topbar-btn"
            onClick={redo}
            disabled={future.length === 0}
            title="Refazer"
            aria-label="Refazer"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          <span className="mx-1 hidden h-5 w-px bg-white/25 sm:block" aria-hidden="true" />

          {/* Ações de arquivo: inline no desktop, menu no mobile */}
          <div className="hidden items-center gap-1.5 md:flex">
            <label className="topbar-btn cursor-pointer" title="Importar um bio.json existente">
              <Upload className="h-4 w-4" />
              <span className="hidden lg:inline">Importar</span>
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImport(file)
                  e.currentTarget.value = ''
                }}
              />
            </label>
            <button type="button" className="topbar-btn" onClick={handleCopy} title="Copiar JSON">
              <Copy className="h-4 w-4" />
              <span className="hidden lg:inline">Copiar</span>
            </button>
            <button type="button" className="topbar-btn" onClick={handleDownload} title="Baixar bio.json">
              <Download className="h-4 w-4" />
              <span className="hidden lg:inline">Baixar</span>
            </button>
          </div>

          <div className="relative md:hidden" ref={moreRef}>
            <button
              type="button"
              className="topbar-btn"
              onClick={() => setMoreOpen((v) => !v)}
              title="Mais ações"
              aria-label="Mais ações"
              aria-expanded={moreOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-lg border border-border bg-card py-1 text-foreground shadow-xl">
                <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  Importar
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImport(file)
                      e.currentTarget.value = ''
                      setMoreOpen(false)
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => {
                    handleCopy()
                    setMoreOpen(false)
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copiar JSON
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => {
                    handleDownload()
                    setMoreOpen(false)
                  }}
                >
                  <Download className="h-4 w-4" />
                  Baixar bio.json
                </button>
              </div>
            )}
          </div>

          <button type="button" className="topbar-save" onClick={handleSave} title="Salvar no servidor">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Salvar</span>
          </button>

          <button
            type="button"
            className="topbar-btn"
            onClick={handleLogout}
            title="Sair da conta"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {status && (
        <div className="pointer-events-none fixed bottom-5 left-5 z-50">
          <div className="pointer-events-auto rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary shadow-lg backdrop-blur">
            {status}
          </div>
        </div>
      )}

      {/* Corpo: rail fixo (retrátil) + conteúdo rolável + preview fixo */}
      <div
        className={`grid grid-cols-1 pt-14 ${
          railExpanded
            ? 'xl:grid-cols-[220px_minmax(0,1fr)_400px]'
            : 'xl:grid-cols-[68px_minmax(0,1fr)_400px]'
        }`}
      >
        <aside
          className={`editor-rail flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-2 xl:sticky xl:top-14 xl:h-[calc(100vh-3.5rem)] xl:flex-col xl:gap-1.5 xl:overflow-x-visible xl:border-b-0 xl:border-r xl:py-4 ${
            railExpanded ? 'xl:items-stretch xl:px-3' : 'xl:items-center xl:px-0'
          }`}
        >
          <div
            className={`mb-1 hidden shrink-0 items-center gap-2 xl:flex ${
              railExpanded ? 'w-full justify-between' : 'justify-center'
            }`}
          >
            {railExpanded && (
              <div className="flex items-center gap-2">
                <img
                  src={`${import.meta.env.BASE_URL}logo-instabio.svg`}
                  alt="insta-bio"
                  className="h-9 w-9 shrink-0 rounded-lg"
                  title="insta-bio"
                />
                <span className="text-sm font-semibold">insta-bio</span>
              </div>
            )}
            <button
              type="button"
              className={`rail-btn ${railExpanded ? 'h-9 w-9 justify-center' : 'h-11 w-11 justify-center'}`}
              onClick={() => setRailExpanded((v) => !v)}
              title={railExpanded ? 'Recolher menu' : 'Expandir menu'}
              aria-label={railExpanded ? 'Recolher menu' : 'Expandir menu'}
            >
              {railExpanded ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </button>
          </div>

          {railTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                className={`rail-btn h-11 shrink-0 ${
                  railExpanded ? 'w-full justify-start gap-3 px-3' : 'w-11 justify-center'
                } ${tab.mobileOnly ? 'xl:hidden!' : ''} ${
                  activeTab === tab.id ? 'active' : ''
                }`}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                aria-label={tab.label}
              >
                <Icon className="h-5 w-5" />
                {railExpanded && <span className="text-sm">{tab.label}</span>}
              </button>
            )
          })}

          <button
            type="button"
            className={`rail-btn h-11 shrink-0 xl:mt-auto ${
              railExpanded ? 'w-full justify-start gap-3 px-3' : 'w-11 justify-center'
            }`}
            onClick={toggleTheme}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {railExpanded && <span className="text-sm">{isDark ? 'Modo claro' : 'Modo escuro'}</span>}
          </button>
        </aside>

        <main className="min-w-0 p-4 sm:p-6">
          {activeTab === 'brand' && (
            <div>
              <BrandForm
                brand={config.brand}
                onChange={(brand) => commit({ ...config, brand })}
              />
              <div className="mt-4">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => commit(createDefaultConfig())}
                >
                  Restaurar modelo padrão
                </button>
              </div>
            </div>
          )}

          {activeTab === 'sections' && config.sections.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[210px_minmax(0,1fr)]">
                <div className="card min-w-0 space-y-2 self-start md:sticky md:top-20 md:max-h-[calc(100vh-6.5rem)] md:overflow-y-auto">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Seções
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">Arraste para reordenar</p>
                  {config.sections.map((section, index) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (dropIndex !== index) setDropIndex(index)
                      }}
                      onDrop={() => {
                        if (dragIndex !== null) reorderSections(dragIndex, index)
                        setDragIndex(null)
                        setDropIndex(null)
                      }}
                      onDragEnd={() => {
                        setDragIndex(null)
                        setDropIndex(null)
                      }}
                      className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs transition-colors ${
                        activeSection === index
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground'
                      } ${dropIndex === index && dragIndex !== index ? 'ring-1 ring-primary' : ''} ${
                        dragIndex === index ? 'opacity-50' : ''
                      }`}
                    >
                      <span
                        className="cursor-grab select-none text-muted-foreground/60 active:cursor-grabbing"
                        aria-hidden="true"
                        title="Arraste para reordenar"
                      >
                        ⠿
                      </span>
                      <button
                        type="button"
                        className="flex-1 truncate text-left"
                        onClick={() => setActiveSection(index)}
                      >
                        {section.title || section.id}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-secondary w-full py-1.5 text-xs"
                    onClick={() => {
                      commit({
                        ...config,
                        sections: [...config.sections, createSection()],
                      })
                      setActiveSection(config.sections.length)
                    }}
                  >
                    + Nova seção
                  </button>
                </div>

                <SectionEditor
                  section={config.sections[activeSection]}
                  onChange={(section) => {
                    const sections = [...config.sections]
                    sections[activeSection] = section
                    commit({ ...config, sections })
                  }}
                  onRemove={() => {
                    const sections = config.sections.filter((_, i) => i !== activeSection)
                    commit({ ...config, sections })
                    setActiveSection(Math.max(0, activeSection - 1))
                  }}
                />
              </div>
            )}

            {activeTab === 'sections' && config.sections.length === 0 && (
              <div className="card text-center">
                <p className="mb-4 text-sm text-muted-foreground">Nenhuma seção ainda.</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => commit({ ...config, sections: [createSection()] })}
                >
                  Criar primeira seção
                </button>
              </div>
            )}

            {activeTab === 'images' && <ImagesGallery config={config} />}

            {activeTab === 'json' && <JsonPanel config={config} />}

            {activeTab === 'preview' && (
              <div className="xl:hidden">
                <PreviewPanel config={config} />
              </div>
            )}
        </main>

        <div className="hidden border-l border-border p-4 xl:sticky xl:top-14 xl:block xl:h-[calc(100vh-3.5rem)] xl:overflow-y-auto">
          <PreviewPanel config={config} />
        </div>
      </div>
    </div>
  )
}
