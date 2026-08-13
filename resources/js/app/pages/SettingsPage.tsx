import { ErrorText, PageShell } from '../../shared/ui'
import { csrfToken } from '../../shared/csrf'
import { useSettings } from '../hooks/useSettings'
import { PlanCard } from '../components/PlanCard'
import { DomainForm } from '../components/DomainForm'

/**
 * Plano, checkout Pro e domínio próprio.
 */
export function SettingsPage() {
  const settings = useSettings()

  return (
    <PageShell maxWidth="max-w-2xl">
      <div className="flex items-center justify-between">
        <a href="/app" className="text-sm text-primary">
          ← Voltar ao editor
        </a>
        <form method="POST" action="/logout">
          <input type="hidden" name="_token" value={csrfToken()} />
          <button className="text-sm text-muted" type="submit">
            Sair
          </button>
        </form>
      </div>
      <h1 className="mt-6 text-3xl font-semibold">Configurações</h1>
      <PlanCard billing={settings.billing} onUpgrade={() => void settings.upgrade()} />
      <DomainForm
        domain={settings.domain}
        host={settings.host}
        onHost={settings.setHost}
        onSave={settings.saveDomain}
        onVerify={() => void settings.verify()}
      />
      {settings.message && <p className="mt-4 text-sm text-primary">{settings.message}</p>}
      <ErrorText>{settings.error}</ErrorText>
    </PageShell>
  )
}
