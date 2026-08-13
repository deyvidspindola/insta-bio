import type { FormEvent } from 'react'
import { Button } from '../../shared/ui'
import type { DomainState } from '../application/settingsApi'

type Props = {
  domain: DomainState | null
  host: string
  onHost: (value: string) => void
  onSave: (event: FormEvent) => void
  onVerify: () => void
}

/**
 * Formulário de domínio próprio (CNAME/TXT).
 */
export function DomainForm({ domain, host, onHost, onSave, onVerify }: Props) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-medium">Domínio próprio</h2>
      <p className="mt-2 text-sm text-muted">
        Recurso Pro. Crie um CNAME apontando para <code>{domain?.cname}</code>.
      </p>
      <form className="mt-4 space-y-3" onSubmit={onSave}>
        <input
          value={host}
          onChange={(e) => onHost(e.target.value)}
          placeholder="bio.seudominio.com.br"
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
        />
        <div className="flex gap-2">
          <Button className="py-2" type="submit">
            Salvar
          </Button>
          <Button className="py-2" variant="outline" type="button" onClick={onVerify}>
            Verificar DNS
          </Button>
        </div>
      </form>
      {domain?.domain?.verified_at && (
        <p className="mt-3 text-sm text-green-400">Verificado em {domain.domain.domain}</p>
      )}
    </section>
  )
}
