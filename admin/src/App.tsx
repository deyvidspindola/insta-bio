import { useEffect, useRef, useState } from 'react'
import {
  Copy,
  Download,
  Images,
  Layers,
  LogOut,
  Moon,
  Palette,
  Save,
  Settings,
  Smartphone,
  Sun,
  Undo2,
  Upload,
  User,
  Redo2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import type { BioConfig } from '@bio-types'
import { AdvancedPanel } from './components/AdvancedPanel'
import { AppearanceForm } from './components/AppearanceForm'
import { IdentityForm } from './components/IdentityForm'
import { ImagesGallery } from './components/ImagesGallery'
import { LoginScreen } from './components/LoginScreen'
import { PreviewPanel } from './components/PreviewPanel'
import { PreviewSheet } from './components/PreviewSheet'
import { SectionEditor } from './components/SectionEditor'
import { SectionMobilePicker, SectionSidebar } from './components/SectionSidebar'
import { fetchSession, logout, saveBioConfig } from './lib/auth'
import {
  copyBioConfig,
  createDefaultConfig,
  createSection,
  downloadBioConfig,
  loadBioConfig,
} from './lib/bio'
import { applyTheme, getStoredTheme, type Theme } from './lib/theme'

type Tab = 'identity' | 'appearance' | 'sections' | 'images' | 'advanced'

const HISTORY_LIMIT = 50

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [config, setConfig] = useState<BioConfig | null>(null)
  const [past, setPast] = useState<BioConfig[]>([])
  const [future, setFuture] = useState<BioConfig[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('identity')
  const [activeSection, setActiveSection] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())
  const [railExpanded, setRailExpanded] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const statusTimerRef = useRef<number | null>(null)

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  function commit(next: BioConfig) {
    if (config) setPast((p) => [...p.slice(-(HISTORY_LIMIT - 1)), config])
    setFuture([])
    setConfig(next)
  }

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
        showStatus('Configuração carregada')
      })
      .catch((err: Error) => setError(err.message))
  }, [authenticated])

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
    }
  }, [])

  async function handleLogout() {
    await logout()
    setAuthenticated(false)
    setConfig(null)
  }

  function showStatus(message: string) {
    setStatus(message)
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
    statusTimerRef.current = window.setTimeout(() => setStatus(null), 3000)
  }

  async function handleCopy() {
    if (!config) return
    await copyBioConfig(config)
    showStatus('JSON copiado para a área de transferência')
  }

  function handleDownload() {
    if (!config) return
    downloadBioConfig(config)
    showStatus('bio.json baixado')
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

  function addSection() {
    if (!config) return
    commit({ ...config, sections: [...config.sections, createSection()] })
    setActiveSection(config.sections.length)
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

  const railTabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'identity', label: 'Identidade', icon: User },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'sections', label: 'Conteúdo', icon: Layers },
    { id: 'images', label: 'Imagens', icon: Images },
    { id: 'advanced', label: 'Avançado', icon: Settings },
  ]

  const isDark = theme === 'dark'

  return (
    <div className="min-h-screen">
      <header className="editor-topbar fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-x-2 px-3 sm:gap-x-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
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

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
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

          <button
            type="button"
            className="topbar-btn hidden sm:inline-flex"
            onClick={toggleTheme}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <span className="mx-0.5 hidden h-5 w-px bg-white/25 md:block" aria-hidden="true" />

          <div className="hidden items-center gap-1.5 md:flex">
            <label className="topbar-btn cursor-pointer" title="Importar bio.json">
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

          <button type="button" className="topbar-save" onClick={handleSave} title="Salvar no servidor">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Salvar</span>
          </button>

          <button
            type="button"
            className="topbar-btn"
            onClick={handleLogout}
            title="Sair"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {status && (
        <div className="pointer-events-none fixed bottom-20 left-4 z-50 md:bottom-5">
          <div className="pointer-events-auto rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary shadow-lg backdrop-blur">
            {status}
          </div>
        </div>
      )}

      <div
        className={`editor-shell grid grid-cols-1 pt-14 md:grid-cols-[minmax(0,1fr)_min(340px,38vw)] ${
          railExpanded
            ? 'xl:grid-cols-[220px_minmax(0,1fr)_400px]'
            : 'xl:grid-cols-[68px_minmax(0,1fr)_400px]'
        }`}
      >
        <aside
          className={`editor-rail sticky top-14 z-30 border-b border-border xl:top-14 xl:col-span-1 xl:row-span-1 xl:h-[calc(100vh-3.5rem)] xl:border-b-0 xl:border-r xl:py-4 md:col-span-2 ${
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
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-lg"
                />
                <span className="text-sm font-semibold">Menu</span>
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

          <nav
            className={`editor-rail-nav ${
              railExpanded ? 'xl:items-stretch' : 'xl:items-center'
            }`}
            aria-label="Menu principal"
          >
            {railTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`rail-btn ${
                    railExpanded
                      ? 'xl:w-full xl:justify-start xl:gap-3 xl:px-3'
                      : 'xl:w-11 xl:justify-center xl:px-0'
                  } ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  aria-label={tab.label}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {railExpanded && <span className="hidden text-sm xl:inline">{tab.label}</span>}
                </button>
              )
            })}

            <button
              type="button"
              className={`rail-btn sm:hidden ${
                railExpanded
                  ? 'xl:w-full xl:justify-start xl:gap-3 xl:px-3'
                  : 'xl:w-11 xl:justify-center xl:px-0'
              } xl:mt-auto`}
              onClick={toggleTheme}
              title={isDark ? 'Modo claro' : 'Modo escuro'}
              aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {isDark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
              {railExpanded && <span className="hidden text-sm xl:inline">{isDark ? 'Modo claro' : 'Modo escuro'}</span>}
            </button>
          </nav>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 md:col-start-1 md:row-start-2 xl:col-start-2 xl:row-start-1">
          {activeTab === 'identity' && (
            <IdentityForm brand={config.brand} onChange={(brand) => commit({ ...config, brand })} />
          )}

          {activeTab === 'appearance' && (
            <AppearanceForm brand={config.brand} onChange={(brand) => commit({ ...config, brand })} />
          )}

          {activeTab === 'sections' && config.sections.length > 0 && (
            <>
              <SectionMobilePicker
                sections={config.sections}
                activeSection={activeSection}
                onSelect={setActiveSection}
                onAdd={addSection}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[210px_minmax(0,1fr)]">
                <div className="hidden md:block">
                  <SectionSidebar
                    sections={config.sections}
                    activeSection={activeSection}
                    dragIndex={dragIndex}
                    dropIndex={dropIndex}
                    onSelect={setActiveSection}
                    onReorder={reorderSections}
                    onAdd={addSection}
                    onDragStart={setDragIndex}
                    onDragOver={(index) => {
                      if (dragIndex !== null && dropIndex !== index) setDropIndex(index)
                    }}
                    onDrop={(index) => {
                      if (dragIndex !== null) reorderSections(dragIndex, index)
                      setDragIndex(null)
                      setDropIndex(null)
                    }}
                    onDragEnd={() => {
                      setDragIndex(null)
                      setDropIndex(null)
                    }}
                  />
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
            </>
          )}

          {activeTab === 'sections' && config.sections.length === 0 && (
            <div className="card text-center">
              <p className="mb-4 text-sm text-muted-foreground">Nenhuma seção ainda.</p>
              <button type="button" className="btn-primary" onClick={addSection}>
                Criar primeira seção
              </button>
            </div>
          )}

          {activeTab === 'images' && <ImagesGallery config={config} />}

          {activeTab === 'advanced' && (
            <AdvancedPanel
              config={config}
              onImport={handleImport}
              onCopy={handleCopy}
              onDownload={handleDownload}
              onRestoreDefault={() => commit(createDefaultConfig())}
            />
          )}
        </main>

        <div className="editor-preview-col hidden border-l border-border p-3 md:col-start-2 md:row-start-2 md:block md:sticky md:top-14 md:max-h-[calc(100vh-3.5rem)] md:overflow-y-auto md:p-4 xl:col-start-3 xl:row-start-1">
          <p className="mb-3 hidden text-[10px] font-semibold uppercase tracking-wider text-muted-foreground xl:block">
            Preview ao vivo
          </p>
          <PreviewPanel config={config} compact />
        </div>
      </div>

      <button
        type="button"
        className="preview-fab md:hidden"
        onClick={() => setPreviewOpen(true)}
        aria-label="Abrir preview da bio"
      >
        <Smartphone className="h-5 w-5" />
        Preview
      </button>

      <PreviewSheet config={config} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  )
}
