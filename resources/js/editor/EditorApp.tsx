import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  Eye,
  FileText,
  Globe,
  Images,
  Inbox,
  Kanban,
  Layers,
  LayoutDashboard,
  LogOut,
  Moon,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Redo2,
  Save,
  Sun,
  Undo2,
  User,
  Wrench,
} from 'lucide-react'
import type { BioConfig } from '@bio-types'
import { AccountSettingsPanel } from './components/AccountSettingsPanel'
import { AdvancedPanel } from './components/AdvancedPanel'
import { AppearanceForm } from './components/AppearanceForm'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DashboardPanel } from './components/DashboardPanel'
import { FormSubmissionsPanel } from './components/FormSubmissionsPanel'
import { IdentityForm } from './components/IdentityForm'
import { ImagesGallery } from './components/ImagesGallery'
import { LeadsPanel } from './components/LeadsPanel'
import { LoginScreen } from './components/LoginScreen'
import { PagesPanel } from './components/PagesPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { PreviewSheet } from './components/PreviewSheet'
import { fetchEditorPaths } from './lib/paths'
import { setBioJsonRelativePath } from '@site/lib/publicUrl'
import { QuickAddLink } from './components/QuickAddLink'
import { SectionEditor } from './components/SectionEditor'
import { SectionMobilePicker, SectionSidebar } from './components/SectionSidebar'
import { DemoModeProvider } from './context/DemoModeContext'
import { useBioPages } from './hooks/useBioPages'
import {
  fetchSession,
  loadEditorConfig,
  logout,
  publishBioConfig,
  restoreBioBackup,
  revertDraftToPublished,
  saveBioConfig,
} from './lib/auth'
import { BRAND_LOGO_URL, BRAND_NAME } from './lib/brand'
import {
  copyBioConfig,
  createDefaultConfig,
  createDefaultSection,
  createSection,
  createSimpleLink,
  downloadBioConfig,
  normalizeBioConfig,
} from './lib/bio'
import { DEMO_WHATSAPP_URL, loadDemoConfig } from './lib/demo'
import { applyTheme, getStoredTheme, type Theme } from './lib/theme'
import { checkForUpdates } from './lib/updates'
import { syncBrandSeo } from '@site/lib/pageMeta'

type Tab =
  | 'dashboard'
  | 'identity'
  | 'appearance'
  | 'sections'
  | 'pages'
  | 'images'
  | 'respostas'
  | 'funil'
  | 'account'
  | 'advanced'
type EditorMode = 'full' | 'demo'

/** Tabs de gestão (sem coluna de preview). */
const WORKSPACE_TABS: Tab[] = ['respostas', 'funil', 'account']

function isPlanLimitError(message: string) {
  return /plano|upgrade|\bpro\b/i.test(message)
}

function tabFromHash(): Tab | null {
  const hash = window.location.hash.replace(/^#/, '').toLowerCase()
  if (hash === 'respostas' || hash === 'forms') return 'respostas'
  if (hash === 'funil' || hash === 'leads') return 'funil'
  if (hash === 'conta' || hash === 'configuracoes' || hash === 'account') return 'account'
  return null
}

function syncHashForTab(tab: Tab) {
  const next =
    tab === 'respostas' ? '#respostas' : tab === 'funil' ? '#funil' : tab === 'account' ? '#conta' : ''
  const target = `/app${next}`
  if (`${window.location.pathname}${window.location.hash}` !== target) {
    window.history.replaceState(null, '', target)
  }
}

const HISTORY_LIMIT = 50
const UPDATE_PROMPT_KEY = 'insta-bio:update-prompt-dismissed'

interface EditorAppProps {
  mode?: EditorMode
}

export default function EditorApp({ mode = 'full' }: EditorAppProps) {
  const isDemo = mode === 'demo'
  const [authenticated, setAuthenticated] = useState<boolean | null>(isDemo ? true : null)
  const [config, setConfig] = useState<BioConfig | null>(null)
  const [past, setPast] = useState<BioConfig[]>([])
  const [future, setFuture] = useState<BioConfig[]>([])
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromHash() ?? 'dashboard')
  const [activeSection, setActiveSection] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)
  const [focusItemIndex, setFocusItemIndex] = useState<number | null>(null)
  const [openItemRequest, setOpenItemRequest] = useState<{
    sectionId: string
    index: number
    nonce: number
  } | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())
  const [railExpanded, setRailExpanded] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [reverting, setReverting] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false)
  const [updatePromptOpen, setUpdatePromptOpen] = useState(false)
  const [updatePrompt, setUpdatePrompt] = useState<{
    installed: string
    latest: string
    changelog?: string
  } | null>(null)
  const statusTimerRef = useRef<number | null>(null)
  const actionErrorTimerRef = useRef<number | null>(null)
  const pagesApi = useBioPages(!isDemo && authenticated === true)

  function markClean(next: BioConfig) {
    setSavedSnapshot(JSON.stringify(next))
  }

  const isDirty =
    !isDemo &&
    Boolean(config && savedSnapshot !== null && JSON.stringify(config) !== savedSnapshot)

  const editingPage =
    activeTab === 'pages' && pagesApi.selectedSlug !== null && config !== null

  const previewConfig: BioConfig | null =
    editingPage && config
      ? { brand: config.brand, sections: pagesApi.draftSections }
      : config

  const previewFocusSections = editingPage ? pagesApi.draftSections : config?.sections
  const previewFocus =
    previewFocusSections &&
    focusItemIndex !== null &&
    previewFocusSections[activeSection]
      ? {
          sectionId: previewFocusSections[activeSection].id,
          itemIndex: focusItemIndex,
        }
      : null

  function handlePreviewSelect(target: { sectionId: string; itemIndex: number }) {
    const sections = editingPage ? pagesApi.draftSections : config?.sections
    if (!sections) return
    const sectionIndex = sections.findIndex((section) => section.id === target.sectionId)
    if (sectionIndex < 0) return
    if (target.itemIndex < 0 || target.itemIndex >= sections[sectionIndex].items.length) {
      return
    }

    if (!editingPage) setActiveTab('sections')
    setActiveSection(sectionIndex)
    setFocusItemIndex(target.itemIndex)
    setOpenItemRequest({
      sectionId: target.sectionId,
      index: target.itemIndex,
      nonce: Date.now(),
    })
  }

  function selectRailTab(tab: Tab) {
    if (activeTab === 'pages' || tab === 'pages') {
      setActiveSection(0)
      setFocusItemIndex(null)
      setOpenItemRequest(null)
    }
    setActiveTab(tab)
    if (!isDemo) syncHashForTab(tab)
    if (WORKSPACE_TABS.includes(tab)) setPreviewOpen(false)
  }

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  function commit(updater: BioConfig | ((prev: BioConfig) => BioConfig)) {
    setConfig((prev) => {
      if (!prev) return prev
      const next = typeof updater === 'function' ? updater(prev) : updater
      const synced = { ...next, brand: syncBrandSeo(next.brand) }
      setPast((p) => [...p.slice(-(HISTORY_LIMIT - 1)), prev])
      setFuture([])
      return synced
    })
  }

  function resetConfig(next: BioConfig, options?: { clean?: boolean }) {
    setPast([])
    setFuture([])
    setConfig(next)
    if (options?.clean !== false) markClean(next)
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
    commit((prev) => {
      const sections = [...prev.sections]
      const [moved] = sections.splice(from, 1)
      sections.splice(to, 0, moved)
      return { ...prev, sections }
    })

    if (activeSection === from) setActiveSection(to)
    else if (from < activeSection && to >= activeSection) setActiveSection(activeSection - 1)
    else if (from > activeSection && to <= activeSection) setActiveSection(activeSection + 1)
  }

  useEffect(() => {
    if (isDemo) return
    fetchSession()
      .then((session) => {
        if (!session.authenticated) {
          window.location.href = '/login'
          return
        }
        setAuthenticated(true)
      })
      .catch(() => {
        window.location.href = '/login'
      })
  }, [isDemo])

  useEffect(() => {
    if (isDemo || !authenticated) return
    fetchEditorPaths()
      .then((paths) => {
        const relative = paths.publicBioUrl?.trim() || 'bio.json'
        setBioJsonRelativePath(relative)
      })
      .catch(() => {
        setBioJsonRelativePath('bio.json')
      })
  }, [authenticated, isDemo])

  useEffect(() => {
    if (isDemo || !authenticated) return

    let cancelled = false

    async function promptIfUpdate() {
      try {
        const data = await checkForUpdates()
        if (cancelled || !data.updateAvailable || !data.latest) return

        const dismissed = sessionStorage.getItem(UPDATE_PROMPT_KEY)
        if (dismissed === data.latest) return

        setUpdatePrompt({
          installed: data.installed,
          latest: data.latest,
          changelog: data.changelog,
        })
        setUpdatePromptOpen(true)
      } catch (err) {
        console.warn('[updates] check no login falhou', err)
      }
    }

    void promptIfUpdate()
    return () => {
      cancelled = true
    }
  }, [authenticated, isDemo])

  useEffect(() => {
    if (isDemo) {
      loadDemoConfig()
        .then((data) => resetConfig(data))
        .catch((err: Error) => setLoadError(err.message))
      return
    }
    if (!authenticated) return
    loadEditorConfig()
      .then((data) => {
        resetConfig(normalizeBioConfig(data.config))
        showStatus(
          data.source === 'draft'
            ? 'Rascunho carregado'
            : 'Bio publicada carregada',
        )
      })
      .catch((err: Error) => setLoadError(err.message))
  }, [authenticated, isDemo])

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
      if (actionErrorTimerRef.current) window.clearTimeout(actionErrorTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isDirty || isDemo) return
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty, isDemo])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      const mod = event.metaKey || event.ctrlKey
      if (!mod) return

      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }
      if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function handleLogout() {
    await logout()
    setAuthenticated(false)
    setConfig(null)
  }

  function dismissUpdatePrompt() {
    if (updatePrompt?.latest) {
      sessionStorage.setItem(UPDATE_PROMPT_KEY, updatePrompt.latest)
    }
    setUpdatePromptOpen(false)
  }

  function goToUpdateSettings() {
    dismissUpdatePrompt()
    setActiveTab('advanced')
  }

  function showStatus(message: string) {
    setStatus(message)
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
    statusTimerRef.current = window.setTimeout(() => setStatus(null), 3000)
  }

  function showActionError(message: string) {
    setActionError(message)
    if (actionErrorTimerRef.current) window.clearTimeout(actionErrorTimerRef.current)
    if (isPlanLimitError(message)) return
    actionErrorTimerRef.current = window.setTimeout(() => setActionError(null), 6000)
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
    if (!config || isDemo || saving || publishing) return
    setSaving(true)
    setActionError(null)
    try {
      await saveBioConfig(config)
      markClean(config)
      showStatus('Rascunho salvo')
    } catch (err) {
      showActionError(err instanceof Error ? err.message : 'Erro ao salvar rascunho')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!config || isDemo || saving || publishing) return
    setPublishing(true)
    setActionError(null)
    try {
      await publishBioConfig(config)
      markClean(config)
      setConfirmPublishOpen(false)
      showStatus('Bio publicada')
    } catch (err) {
      setConfirmPublishOpen(false)
      showActionError(err instanceof Error ? err.message : 'Erro ao publicar')
    } finally {
      setPublishing(false)
    }
  }

  async function handleRevertToPublished() {
    if (isDemo || reverting) return
    setReverting(true)
    setActionError(null)
    try {
      const published = await revertDraftToPublished()
      resetConfig(normalizeBioConfig(published))
      setActiveSection(0)
      setFocusItemIndex(null)
      showStatus('Rascunho revertido para a bio publicada')
    } catch (err) {
      showActionError(err instanceof Error ? err.message : 'Erro ao reverter rascunho')
      throw err
    } finally {
      setReverting(false)
    }
  }

  async function handleRestoreBackup() {
    if (isDemo || restoringBackup) return
    setRestoringBackup(true)
    setActionError(null)
    try {
      const restored = await restoreBioBackup()
      resetConfig(normalizeBioConfig(restored))
      setActiveSection(0)
      setFocusItemIndex(null)
      showStatus('Backup anterior restaurado na bio pública')
    } catch (err) {
      showActionError(err instanceof Error ? err.message : 'Erro ao restaurar backup')
      throw err
    } finally {
      setRestoringBackup(false)
    }
  }

  function handleImport(file: File) {
    if (isDemo) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as BioConfig
        resetConfig(normalizeBioConfig(parsed), { clean: false })
        setActiveSection(0)
        setFocusItemIndex(null)
        showStatus('JSON importado — salve para gravar o rascunho')
      } catch {
        showActionError('Arquivo JSON inválido')
      }
    }
    reader.readAsText(file)
  }

  function addSection() {
    if (!config) return
    commit((prev) => ({ ...prev, sections: [...prev.sections, createSection()] }))
    setActiveSection(config.sections.length)
    setFocusItemIndex(null)
  }

  function addFirstLink(title: string, url: string) {
    commit((prev) => ({
      ...prev,
      sections: [{ ...createDefaultSection(), items: [createSimpleLink(title, url)] }],
    }))
    setActiveSection(0)
    setFocusItemIndex(0)
  }

  if (!isDemo && authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isDemo && !authenticated) {
    return <LoginScreen onSuccess={() => setAuthenticated(true)} />
  }

  if (loadError && !config) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-red-400">{loadError}</p>
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

  const allRailTabs: { id: Tab; label: string; shortLabel: string; icon: typeof User }[] = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Stats', icon: LayoutDashboard },
    { id: 'identity', label: 'Identidade', shortLabel: 'Perfil', icon: User },
    { id: 'appearance', label: 'Aparência', shortLabel: 'Visual', icon: Palette },
    { id: 'sections', label: 'Conteúdo', shortLabel: 'Links', icon: Layers },
    { id: 'pages', label: 'Páginas', shortLabel: 'Págs', icon: FileText },
    { id: 'images', label: 'Arquivos', shortLabel: 'Mídia', icon: Images },
    { id: 'respostas', label: 'Respostas', shortLabel: 'Forms', icon: Inbox },
    { id: 'funil', label: 'Funil', shortLabel: 'Leads', icon: Kanban },
    { id: 'account', label: 'Conta', shortLabel: 'Plano', icon: CreditCard },
    { id: 'advanced', label: 'Avançado', shortLabel: 'Extra', icon: Wrench },
  ]

  const railTabs = isDemo
    ? allRailTabs.filter(
        (tab) =>
          tab.id !== 'advanced' &&
          tab.id !== 'images' &&
          tab.id !== 'pages' &&
          tab.id !== 'respostas' &&
          tab.id !== 'funil' &&
          tab.id !== 'account',
      )
    : allRailTabs

  const isDark = theme === 'dark'
  const shellTopPadding = isDemo ? 'pt-[6.75rem]' : 'pt-14'
  const hidePreview = WORKSPACE_TABS.includes(activeTab)

  return (
    <DemoModeProvider value={isDemo}>
      <div className="min-h-screen">
        <header className="editor-topbar fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-x-2 px-3 sm:gap-x-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src={BRAND_LOGO_URL}
              alt={BRAND_NAME}
              className="h-9 w-9 shrink-0 rounded-lg shadow-sm"
              title={BRAND_NAME}
            />
            <div className="hidden leading-tight sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                {BRAND_NAME}
              </p>
              <h1 className="text-sm font-semibold text-white">
                {isDemo ? 'Demonstração do editor' : 'Editor da Bio'}
              </h1>
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

            {!isDemo && (
              <>
                <span className="mx-0.5 hidden h-5 w-px bg-white/25 sm:block" aria-hidden="true" />

                <button
                  type="button"
                  className={`topbar-draft ${isDirty ? 'topbar-draft--dirty' : ''}`}
                  onClick={handleSave}
                  disabled={saving || publishing}
                  title={
                    isDirty
                      ? 'Há alterações não salvas — salvar rascunho (não publica a bio)'
                      : 'Salvar rascunho (não publica a bio)'
                  }
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {saving ? 'Salvando…' : isDirty ? 'Salvar*' : 'Salvar'}
                  </span>
                  {isDirty && !saving && (
                    <span className="dirty-dot sm:hidden" aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  className="topbar-publish"
                  onClick={() => setConfirmPublishOpen(true)}
                  disabled={saving || publishing}
                  title="Salvar rascunho e publicar na bio ao vivo"
                >
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">{publishing ? 'Publicando…' : 'Publicar'}</span>
                </button>

                <button
                  type="button"
                  className="topbar-btn"
                  onClick={() => selectRailTab('respostas')}
                  title="Respostas dos formulários"
                  aria-label="Respostas"
                >
                  <Inbox className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="topbar-btn"
                  onClick={() => selectRailTab('funil')}
                  title="Funil de prospects"
                  aria-label="Funil"
                >
                  <Kanban className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="topbar-btn"
                  onClick={() => selectRailTab('account')}
                  title="Conta e plano"
                  aria-label="Conta"
                >
                  <CreditCard className="h-4 w-4" />
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
              </>
            )}

            {isDemo && (
              <a
                href={DEMO_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="topbar-publish hidden sm:inline-flex"
              >
                <span>Quero minha bio</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </header>

        {isDemo && (
          <div className="demo-banner fixed inset-x-0 top-14 z-40" role="status">
            <p className="demo-banner__text">
              <strong>Demonstração</strong> — explore o editor à vontade. Suas alterações não são salvas.
            </p>
            <a
              href={DEMO_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="demo-banner__cta sm:hidden"
            >
              Quero minha bio
            </a>
          </div>
        )}

        {actionError && (
          <div
            className={`pointer-events-none fixed left-4 right-4 z-[110] md:right-auto md:max-w-md ${
              previewOpen ? 'bottom-[min(62vh,34rem)]' : 'bottom-20'
            } md:bottom-5`}
          >
            <div className="editor-alert pointer-events-auto" role="alert">
              <div className="editor-alert__icon" aria-hidden="true">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="editor-alert__title">
                  {isPlanLimitError(actionError) ? 'Limite do plano Free' : 'Não foi possível concluir'}
                </p>
                <p className="editor-alert__text">{actionError}</p>
                <div className="editor-alert__actions">
                  {isPlanLimitError(actionError) && (
                    <button
                      type="button"
                      className="btn-primary px-3 py-1.5 text-xs"
                      onClick={() => {
                        setActionError(null)
                        selectRailTab('account')
                      }}
                    >
                      Ver plano Pro
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary px-3 py-1.5 text-xs"
                    onClick={() => setActionError(null)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {status && (
          <div
            className={`pointer-events-none fixed left-4 z-50 ${
              previewOpen ? 'bottom-[min(62vh,34rem)]' : 'bottom-20'
            } md:bottom-5`}
          >
            <div className="pointer-events-auto rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary shadow-lg backdrop-blur">
              {status}
            </div>
          </div>
        )}

        {isDirty && !status && !actionError && (
          <div
            className={`pointer-events-none fixed left-4 z-40 ${
              previewOpen ? 'bottom-[min(62vh,34rem)]' : 'bottom-20'
            } md:bottom-5`}
          >
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200/95 shadow backdrop-blur">
              Alterações não salvas
            </div>
          </div>
        )}

        <div
          className={`editor-shell grid grid-cols-1 ${shellTopPadding} ${
            hidePreview
              ? railExpanded
                ? 'xl:grid-cols-[220px_minmax(0,1fr)]'
                : 'xl:grid-cols-[68px_minmax(0,1fr)]'
              : railExpanded
                ? 'md:grid-cols-[minmax(0,1fr)_min(340px,38vw)] xl:grid-cols-[220px_minmax(0,1fr)_400px]'
                : 'md:grid-cols-[minmax(0,1fr)_min(340px,38vw)] xl:grid-cols-[68px_minmax(0,1fr)_400px]'
          } ${previewOpen && !hidePreview ? 'editor-shell--preview-dock' : ''}`}
        >
          <aside
            className={`editor-rail sticky z-30 border-b border-border ${
              hidePreview ? 'xl:col-span-1' : 'md:col-span-2 xl:col-span-1'
            } xl:row-span-1 xl:border-b-0 xl:border-r xl:py-4 ${
              isDemo ? 'top-[6.75rem] xl:h-[calc(100vh-6.75rem)]' : 'top-14 xl:h-[calc(100vh-3.5rem)]'
            } ${railExpanded ? 'editor-rail--expanded xl:px-3' : 'xl:px-2'}`}
          >
            <div className="editor-rail-toggle mb-1 hidden shrink-0 items-center gap-2 xl:flex">
              {railExpanded && (
                <div className="flex items-center gap-2">
                  <img
                    src={BRAND_LOGO_URL}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-lg"
                  />
                  <span className="text-sm font-semibold">Menu</span>
                </div>
              )}
              <button
                type="button"
                className="rail-btn h-11 w-11 justify-center"
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
              className={`editor-rail-nav ${railExpanded ? 'editor-rail-nav--expanded' : ''}`}
              aria-label="Menu principal"
            >
              {railTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`rail-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => selectRailTab(tab.id)}
                    title={tab.label}
                    aria-label={tab.label}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="rail-btn-label xl:hidden">{tab.shortLabel}</span>
                    {railExpanded && <span className="hidden text-sm xl:inline">{tab.label}</span>}
                  </button>
                )
              })}

              <button
                type="button"
                className="rail-btn sm:hidden xl:mt-auto"
                onClick={toggleTheme}
                title={isDark ? 'Modo claro' : 'Modo escuro'}
                aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {isDark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
                <span className="rail-btn-label xl:hidden">{isDark ? 'Claro' : 'Escuro'}</span>
                {railExpanded && (
                  <span className="hidden text-sm xl:inline">
                    {isDark ? 'Modo claro' : 'Modo escuro'}
                  </span>
                )}
              </button>
            </nav>
          </aside>

          <main
            className={`min-w-0 p-4 sm:p-6 xl:col-start-2 xl:row-start-1 ${
              hidePreview ? '' : 'md:col-start-1 md:row-start-2'
            }`}
          >
            {activeTab === 'dashboard' && <DashboardPanel />}

            {activeTab === 'identity' && (
              <IdentityForm brand={config.brand} onChange={(brand) => commit((prev) => ({ ...prev, brand }))} />
            )}

            {activeTab === 'appearance' && (
              <AppearanceForm
                brand={config.brand}
                sections={config.sections}
                onChange={(brand) => commit((prev) => ({ ...prev, brand }))}
                onChangeConfig={(next) => {
                  commit(next)
                  setActiveSection(0)
                  setFocusItemIndex(null)
                }}
              />
            )}

            {activeTab === 'sections' && config.sections.length > 0 && (
              <>
                {config.sections.length > 1 && (
                  <SectionMobilePicker
                    sections={config.sections}
                    activeSection={activeSection}
                    onSelect={(index) => {
                      setActiveSection(index)
                      setFocusItemIndex(null)
                    }}
                    onAdd={addSection}
                    onReorder={reorderSections}
                  />
                )}
                <div
                  className={`grid min-w-0 grid-cols-1 gap-4 ${
                    config.sections.length > 1 ? 'md:grid-cols-[210px_minmax(0,1fr)]' : ''
                  }`}
                >
                  {config.sections.length > 1 && (
                    <div className="hidden md:block">
                      <SectionSidebar
                        sections={config.sections}
                        activeSection={activeSection}
                        dragIndex={dragIndex}
                        dropIndex={dropIndex}
                        onSelect={(index) => {
                          setActiveSection(index)
                          setFocusItemIndex(null)
                        }}
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
                  )}

                  <SectionEditor
                    section={config.sections[activeSection]}
                    theme={config.brand.theme}
                    isOnlySection={config.sections.length <= 1}
                    onAddSection={addSection}
                    onChange={(section) => {
                      commit((prev) => {
                        const sections = [...prev.sections]
                        sections[activeSection] = section
                        return { ...prev, sections }
                      })
                    }}
                    onFocusItem={setFocusItemIndex}
                    openItemRequest={
                      openItemRequest &&
                      openItemRequest.sectionId === config.sections[activeSection].id
                        ? { index: openItemRequest.index, nonce: openItemRequest.nonce }
                        : null
                    }
                    onRemove={() => {
                      commit((prev) => {
                        const sections = prev.sections.filter((_, i) => i !== activeSection)
                        return { ...prev, sections }
                      })
                      setActiveSection(Math.max(0, activeSection - 1))
                      setFocusItemIndex(null)
                      setOpenItemRequest(null)
                    }}
                  />
                </div>
              </>
            )}

            {activeTab === 'sections' && config.sections.length === 0 && (
              <div className="mx-auto max-w-lg space-y-4">
                <div className="px-1 text-center">
                  <h2 className="text-base font-semibold">Seus links</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Adicione o primeiro botão da bio. Título e URL bastam.
                  </p>
                </div>
                <QuickAddLink onAdd={addFirstLink} />
              </div>
            )}

            {!isDemo && activeTab === 'pages' && (
              <PagesPanel
                brand={config.brand}
                pagesApi={pagesApi}
                activeSection={activeSection}
                onActiveSectionChange={setActiveSection}
                onFocusItem={setFocusItemIndex}
                openItemRequest={openItemRequest}
                onClearOpenItemRequest={() => setOpenItemRequest(null)}
                dragIndex={dragIndex}
                dropIndex={dropIndex}
                onDragStart={setDragIndex}
                onDragOver={(index) => {
                  if (dragIndex !== null && dropIndex !== index) setDropIndex(index)
                }}
                onClearDrag={() => {
                  setDragIndex(null)
                  setDropIndex(null)
                }}
                onStatus={showStatus}
                onActionError={showActionError}
              />
            )}

            {!isDemo && activeTab === 'images' && <ImagesGallery config={config} />}

            {!isDemo && activeTab === 'respostas' && <FormSubmissionsPanel />}

            {!isDemo && activeTab === 'funil' && <LeadsPanel />}

            {!isDemo && activeTab === 'account' && <AccountSettingsPanel />}

            {!isDemo && activeTab === 'advanced' && (
              <AdvancedPanel
                config={config}
                onImport={handleImport}
                onCopy={handleCopy}
                onDownload={handleDownload}
                reverting={reverting}
                restoringBackup={restoringBackup}
                onRevertToPublished={handleRevertToPublished}
                onRestoreBackup={handleRestoreBackup}
                onPathsSaved={async () => {
                  const data = await loadEditorConfig()
                  resetConfig(normalizeBioConfig(data.config))
                  const paths = await fetchEditorPaths().catch(() => null)
                  if (paths?.publicBioUrl) {
                    setBioJsonRelativePath(paths.publicBioUrl)
                  }
                  showStatus('Bio recarregada com o novo caminho')
                }}
                onRestoreDefault={() => {
                  const fresh = createDefaultConfig()
                  fresh.brand.name = config.brand.name
                  fresh.brand.footer = config.brand.footer
                  commit(fresh)
                }}
              />
            )}
          </main>

          {!hidePreview && (
          <div
            className={`editor-preview-col hidden min-w-0 overflow-x-hidden border-l border-border p-3 md:col-start-2 md:row-start-2 md:block md:sticky md:overflow-y-auto md:p-4 xl:col-start-3 xl:row-start-1 ${
              isDemo
                ? 'md:top-[6.75rem] md:max-h-[calc(100vh-6.75rem)]'
                : 'md:top-14 md:max-h-[calc(100vh-3.5rem)]'
            }`}
          >
            <p className="mb-3 hidden text-[10px] font-semibold uppercase tracking-wider text-muted-foreground xl:block">
              {editingPage ? 'Preview da página' : 'Preview ao vivo'}
            </p>
            {previewConfig && (
              <PreviewPanel
                config={previewConfig}
                compact
                focus={previewFocus}
                onSelectItem={handlePreviewSelect}
              />
            )}
          </div>
          )}
        </div>

        {!hidePreview && (
        <button
          type="button"
          className={`preview-fab md:hidden ${previewOpen ? 'preview-fab--open' : ''}`}
          onClick={() => setPreviewOpen((open) => !open)}
          aria-label={previewOpen ? 'Fechar preview da bio' : 'Abrir preview da bio'}
          aria-pressed={previewOpen}
        >
          <Eye className="h-5 w-5" />
          {previewOpen ? 'Fechar preview' : editingPage ? 'Ver preview da página' : 'Ver preview da bio'}
        </button>
        )}

        {!hidePreview && previewConfig && (
          <PreviewSheet
            config={previewConfig}
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            focus={previewFocus}
            onSelectItem={handlePreviewSelect}
          />
        )}

        <ConfirmDialog
          open={confirmPublishOpen}
          title="Publicar bio?"
          description={
            <>
              As alterações atuais serão salvas no rascunho e enviadas para a{' '}
              <span className="font-medium text-foreground">bio pública</span>. Visitantes verão o
              conteúdo novo ao recarregar a página.
            </>
          }
          confirmLabel="Publicar"
          cancelLabel="Cancelar"
          variant="default"
          loading={publishing}
          onConfirm={() => void handlePublish()}
          onCancel={() => {
            if (!publishing) setConfirmPublishOpen(false)
          }}
        />

        <ConfirmDialog
          open={updatePromptOpen && updatePrompt !== null}
          title="Nova versão disponível"
          description={
            <>
              <p>
                A versão <strong>{updatePrompt?.latest}</strong> está disponível
                {updatePrompt?.installed ? <> (você está em {updatePrompt.installed})</> : null}.
                Abra Avançado para atualizar com segurança.
              </p>
              {updatePrompt?.changelog ? (
                <p className="mt-2 whitespace-pre-wrap text-xs opacity-90">
                  {updatePrompt.changelog.length > 280
                    ? `${updatePrompt.changelog.slice(0, 280)}…`
                    : updatePrompt.changelog}
                </p>
              ) : null}
            </>
          }
          confirmLabel="Ir para Avançado"
          cancelLabel="Agora não"
          variant="default"
          onConfirm={goToUpdateSettings}
          onCancel={dismissUpdatePrompt}
        />
      </div>
    </DemoModeProvider>
  )
}
