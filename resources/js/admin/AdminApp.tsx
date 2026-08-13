import { ErrorText, PageShell } from '../shared/ui'
import { useAdminBios } from './hooks/useAdminBios'
import { BioTable } from './components/BioTable'

/**
 * Painel admin: busca, plano, status e impersonação.
 */
export function AdminApp() {
  const admin = useAdminBios()

  return (
    <PageShell maxWidth="max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin · bios</h1>
        <a href="/app" className="text-sm text-primary">
          Editor
        </a>
      </div>
      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault()
          void admin.load()
        }}
      >
        <input
          value={admin.q}
          onChange={(e) => admin.setQ(e.target.value)}
          placeholder="Buscar slug, e-mail ou nome"
          className="w-full rounded-xl border border-border bg-card px-3 py-2"
        />
      </form>
      <ErrorText>{admin.error}</ErrorText>
      <BioTable bios={admin.bios} onPatch={admin.patch} onImpersonate={admin.impersonate} />
    </PageShell>
  )
}
