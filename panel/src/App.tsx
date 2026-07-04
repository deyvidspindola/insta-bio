import { useCallback, useEffect, useState } from 'react'
import {
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Sun,
  Users,
} from 'lucide-react'
import { LoginScreen } from './components/LoginScreen'
import { ClientTable } from './components/ClientTable'
import { CreateClientModal } from './components/CreateClientModal'
import { CredentialsModal } from './components/CredentialsModal'
import { EditClientModal } from './components/EditClientModal'
import { PasswordModal } from './components/PasswordModal'
import { fetchSession, logout } from './lib/auth'
import {
  deleteClient,
  listClients,
  setClientStatus,
  type Client,
  type CreatedClient,
} from './lib/clients'
import { applyTheme, getStoredTheme, type Theme } from './lib/theme'

type Tab = 'clients'

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [created, setCreated] = useState<CreatedClient | null>(null)
  const [passwordClient, setPasswordClient] = useState<Client | null>(null)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())
  const [railExpanded, setRailExpanded] = useState(false)
  const [activeTab] = useState<Tab>('clients')

  const isDark = theme === 'dark'

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  const loadClients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setClients(await listClients())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
      .then((session) => {
        setAuthenticated(session.authenticated)
        setUser(session.user)
      })
      .catch(() => setAuthenticated(false))
  }, [])

  useEffect(() => {
    if (authenticated) void loadClients()
  }, [authenticated, loadClients])

  async function handleLogout() {
    await logout()
    setAuthenticated(false)
    setUser(null)
    setClients([])
  }

  async function handleToggleStatus(client: Client) {
    const next = client.status === 'active' ? 'suspended' : 'active'
    try {
      await setClientStatus(client.id, next)
      await loadClients()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status')
    }
  }

  async function handleDelete(client: Client) {
    if (
      !window.confirm(
        `Excluir "${client.name}"? A pasta /${client.slug}/ será removida permanentemente.`,
      )
    ) {
      return
    }
    try {
      await deleteClient(client.id)
      await loadClients()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <LoginScreen
        onSuccess={() => {
          setAuthenticated(true)
          fetchSession().then((s) => setUser(s.user))
        }}
      />
    )
  }

  const railTabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'clients', label: 'Clientes', icon: Users },
  ]

  const activeCount = clients.filter((c) => c.status === 'active').length

  return (
    <div className="min-h-screen">
      {/* Header fixo laranja */}
      <header className="editor-topbar fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-x-3 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}logo-instabio.svg`}
            alt="Links na Bio"
            className="h-9 w-9 shrink-0 rounded-lg shadow-sm"
            title="Links na Bio"
          />
          <div className="hidden leading-tight sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              Links na Bio
            </p>
            <h1 className="text-sm font-semibold text-white">Painel da plataforma</h1>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            className="topbar-btn"
            onClick={() => loadClients()}
            disabled={loading}
            title="Atualizar lista"
            aria-label="Atualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            className="topbar-cta"
            onClick={() => setCreateOpen(true)}
            title="Cadastrar novo cliente"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo cliente</span>
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

      {/* Corpo: rail lateral + conteúdo */}
      <div
        className={`grid grid-cols-1 pt-14 ${
          railExpanded ? 'xl:grid-cols-[220px_minmax(0,1fr)]' : 'xl:grid-cols-[68px_minmax(0,1fr)]'
        }`}
      >
        <aside
          className={`editor-rail sticky top-14 z-30 flex items-center justify-center gap-1 overflow-x-auto border-b border-border px-2 py-2 xl:top-14 xl:h-[calc(100vh-3.5rem)] xl:flex-col xl:justify-start xl:gap-1.5 xl:overflow-x-visible xl:border-b-0 xl:border-r xl:py-4 ${
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
                <LayoutDashboard className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">Plataforma</span>
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
                } ${activeTab === tab.id ? 'active' : ''}`}
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
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Clientes</h2>
              <p className="text-sm text-muted-foreground">
                {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'} · {activeCount}{' '}
                {activeCount === 1 ? 'ativo' : 'ativos'}
                {user ? ` · ${user}` : ''}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading && clients.length === 0 ? (
            <div className="card flex items-center justify-center py-16 text-sm text-muted-foreground">
              Carregando clientes…
            </div>
          ) : (
            <ClientTable
              clients={clients}
              onToggleStatus={(client) => void handleToggleStatus(client)}
              onDelete={(client) => void handleDelete(client)}
              onViewPassword={(client) => setPasswordClient(client)}
              onEdit={(client) => setEditClient(client)}
            />
          )}
        </main>
      </div>

      <CreateClientModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(client) => {
          setCreated(client)
          void loadClients()
        }}
      />

      <CredentialsModal client={created} onClose={() => setCreated(null)} />

      <PasswordModal client={passwordClient} onClose={() => setPasswordClient(null)} />

      <EditClientModal
        client={editClient}
        onClose={() => setEditClient(null)}
        onUpdated={() => void loadClients()}
      />
    </div>
  )
}
