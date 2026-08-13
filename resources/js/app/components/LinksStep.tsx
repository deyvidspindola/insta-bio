import type { FormEvent } from 'react'
import { Button, ErrorText } from '../../shared/ui'
import type { OnboardingLink } from '../application/buildOnboardingConfig'

type Props = {
  name: string
  links: OnboardingLink[]
  error: string | null
  pending: boolean
  onName: (value: string) => void
  onLink: (index: number, field: keyof OnboardingLink, value: string) => void
  onAddLink: () => void
  onSubmit: (event: FormEvent) => void
}

/**
 * Passo 3: nome da bio e links iniciais.
 */
export function LinksStep({ name, links, error, pending, onName, onLink, onAddLink, onSubmit }: Props) {
  return (
    <form className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6" onSubmit={onSubmit}>
      <label className="block text-sm">
        <span className="text-muted">Nome da bio</span>
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2"
        />
      </label>
      {links.map((link, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-2">
          <input
            value={link.title}
            onChange={(e) => onLink(index, 'title', e.target.value)}
            placeholder="Título"
            className="rounded-xl border border-border bg-background px-3 py-2"
          />
          <input
            value={link.url}
            onChange={(e) => onLink(index, 'url', e.target.value)}
            placeholder="https://"
            className="rounded-xl border border-border bg-background px-3 py-2"
          />
        </div>
      ))}
      {links.length < 8 && (
        <button type="button" className="text-sm text-primary" onClick={onAddLink}>
          + adicionar link
        </button>
      )}
      <ErrorText>{error}</ErrorText>
      <Button disabled={pending} type="submit">
        {pending ? 'Publicando…' : 'Publicar bio'}
      </Button>
    </form>
  )
}
