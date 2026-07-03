import { useEffect, useState } from 'react'
import { Copy, Download, LogOut, Save, SlidersHorizontal, Upload } from 'lucide-react'
import type { BioConfig } from '@bio-types'
import { BrandForm } from './components/BrandForm'
import { JsonPanel } from './components/JsonPanel'
import { LoginScreen } from './components/LoginScreen'
import { PreviewPanel } from './components/PreviewPanel'
import { SectionEditor } from './components/SectionEditor'
import { ThemeToggle } from './components/ThemeToggle'
import { fetchSession, logout, saveBioConfig } from './lib/auth'
import {
  copyBioConfig,
  createEmptyConfig,
  createSection,
  downloadBioConfig,
  loadBioConfig,
} from './lib/bio'

type Tab = 'brand' | 'sections' | 'json' | 'preview'

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [config, setConfig] = useState<BioConfig | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('brand')
  const [activeSection, setActiveSection] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  function reorderSections(from: number, to: number) {
    if (!config || from === to) return
    const sections = [...config.sections]
    const [moved] = sections.splice(from, 1)
    sections.splice(to, 0, moved)
    setConfig({ ...config, sections })

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
        setConfig(data)
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
        setConfig(parsed)
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

  const tabs: { id: Tab; label: string; mobileOnly?: boolean }[] = [
    { id: 'brand', label: 'Marca' },
    { id: 'sections', label: 'Seções' },
    { id: 'json', label: 'JSON' },
    { id: 'preview', label: 'Preview', mobileOnly: true },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                insta-bio admin
              </p>
              <h1 className="text-lg font-semibold leading-tight">Editor da Bio</h1>
              <p className="text-xs text-muted-foreground">
                Edite links e textos, salve e publique
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="btn-secondary h-10 cursor-pointer" title="Importar um bio.json existente">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
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
            <button type="button" className="btn-secondary h-10" onClick={handleCopy} title="Copiar JSON">
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Copiar</span>
            </button>
            <button type="button" className="btn-secondary h-10" onClick={handleDownload} title="Baixar bio.json">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Baixar</span>
            </button>

            <div className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />

            <button type="button" className="btn-primary h-10" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Salvar
            </button>

            <ThemeToggle />

            <button
              type="button"
              className="btn-ghost h-10"
              onClick={handleLogout}
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {status && (
        <div className="pointer-events-none fixed bottom-4 left-4 z-50">
          <div className="pointer-events-auto rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary shadow-lg backdrop-blur">
            {status}
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-[1600px] items-start gap-6 px-4 py-6 xl:grid-cols-[220px_minmax(0,1fr)_400px]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="card p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    tab.mobileOnly ? 'xl:hidden' : ''
                  } ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'sections' && (
            <div className="card space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Seções
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                Arraste para reordenar
              </p>
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
                    activeSection === index ? 'bg-muted text-foreground' : 'text-muted-foreground'
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
                  setConfig({
                    ...config,
                    sections: [...config.sections, createSection()],
                  })
                  setActiveSection(config.sections.length)
                }}
              >
                + Nova seção
              </button>
            </div>
          )}

        </aside>

        <main>
          {activeTab === 'brand' && (
            <BrandForm brand={config.brand} onChange={(brand) => setConfig({ ...config, brand })} />
          )}

          {activeTab === 'sections' && config.sections.length > 0 && (
            <SectionEditor
              section={config.sections[activeSection]}
              onChange={(section) => {
                const sections = [...config.sections]
                sections[activeSection] = section
                setConfig({ ...config, sections })
              }}
              onRemove={() => {
                const sections = config.sections.filter((_, i) => i !== activeSection)
                setConfig({ ...config, sections })
                setActiveSection(Math.max(0, activeSection - 1))
              }}
            />
          )}

          {activeTab === 'sections' && config.sections.length === 0 && (
            <div className="card text-center">
              <p className="mb-4 text-sm text-muted-foreground">Nenhuma seção ainda.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  setConfig({ ...config, sections: [createSection()] })
                }
              >
                Criar primeira seção
              </button>
            </div>
          )}

          {activeTab === 'json' && <JsonPanel config={config} />}

          {activeTab === 'preview' && (
            <div className="xl:hidden">
              <PreviewPanel config={config} />
            </div>
          )}

          {activeTab === 'brand' && (
            <div className="mt-4">
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setConfig(createEmptyConfig())}
              >
                Limpar e começar do zero
              </button>
            </div>
          )}
        </main>

        <div className="hidden xl:sticky xl:top-24 xl:block xl:self-start">
          <PreviewPanel config={config} />
        </div>
      </div>
    </div>
  )
}
