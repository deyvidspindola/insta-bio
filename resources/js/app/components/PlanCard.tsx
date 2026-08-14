import { Button } from '../../shared/ui'
import type { Billing } from '../application/settingsApi'

/**
 * Card do plano atual, CTA de upgrade e checkout sandbox.
 */
export function PlanCard({
  billing,
  sandboxOpen,
  pending,
  onUpgrade,
  onSandbox,
  onCloseSandbox,
}: {
  billing: Billing | null
  sandboxOpen: boolean
  pending: boolean
  onUpgrade: () => void
  onSandbox: (action: 'approve' | 'reject') => void
  onCloseSandbox: () => void
}) {
  const sandbox = Boolean(billing?.sandbox)
  const local = billing?.driver === 'local'

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-medium">Plano</h2>
        {sandbox && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
            {local ? 'Sandbox local' : 'Sandbox Mercado Pago'}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">Atual: {billing?.plan === 'pro' ? 'Pro' : 'Free'}</p>

      {billing?.plan !== 'pro' && !sandboxOpen && (
        <Button className="mt-4" type="button" disabled={pending} onClick={onUpgrade}>
          {pending ? 'Abrindo checkout…' : `Assinar Pro — R$ ${billing?.price ?? 29.9}`}
        </Button>
      )}

      {sandbox && local && billing?.plan !== 'pro' && (
        <p className="mt-3 text-xs text-muted">
          Sem credencial do Mercado Pago: o checkout abre um simulador nesta tela. Com token TEST, o
          fluxo vai para o sandbox oficial.
        </p>
      )}

      {sandboxOpen && (
        <div className="mt-5 rounded-xl border border-amber-500/35 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold">Checkout sandbox</p>
          <p className="mt-1 text-sm text-muted">
            Simula o pagamento de R$ {billing?.price ?? 29.9} sem cobrar de verdade.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" disabled={pending} onClick={() => onSandbox('approve')}>
              {pending ? 'Aguarde…' : 'Aprovar pagamento'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onSandbox('reject')}
            >
              Recusar
            </Button>
            <Button type="button" variant="ghost" disabled={pending} onClick={onCloseSandbox}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
