import { Button } from '../../shared/ui'
import type { Billing } from '../application/settingsApi'

/**
 * Card do plano atual e CTA de upgrade Pro.
 */
export function PlanCard({ billing, onUpgrade }: { billing: Billing | null; onUpgrade: () => void }) {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-medium">Plano</h2>
      <p className="mt-2 text-sm text-muted">Atual: {billing?.plan === 'pro' ? 'Pro' : 'Free'}</p>
      {billing?.plan !== 'pro' && (
        <Button className="mt-4" type="button" onClick={onUpgrade}>
          Assinar Pro — R$ {billing?.price ?? 29.9}
        </Button>
      )}
    </section>
  )
}
