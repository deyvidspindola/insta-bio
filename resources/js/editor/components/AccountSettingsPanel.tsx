import { ErrorText } from '../../shared/ui'
import { useSettings } from '../../app/hooks/useSettings'
import { PlanCard } from '../../app/components/PlanCard'
import { DomainForm } from '../../app/components/DomainForm'

/**
 * Plano e domínio — painel de conta dentro do layout do editor.
 */
export function AccountSettingsPanel() {
  const settings = useSettings()

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Conta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Plano, cobrança e domínio próprio.</p>
      </div>

      <PlanCard
        billing={settings.billing}
        sandboxOpen={settings.sandboxOpen}
        pending={settings.pending}
        onUpgrade={() => void settings.upgrade()}
        onSandbox={(action) => void settings.sandbox(action)}
        onCloseSandbox={settings.closeSandbox}
      />
      <DomainForm
        domain={settings.domain}
        host={settings.host}
        onHost={settings.setHost}
        onSave={settings.saveDomain}
        onVerify={() => void settings.verify()}
      />
      {settings.message && <p className="text-sm text-primary">{settings.message}</p>}
      <ErrorText>{settings.error}</ErrorText>
    </div>
  )
}
