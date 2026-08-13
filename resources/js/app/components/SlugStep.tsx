import { Button, ErrorText } from '../../shared/ui'

type Props = {
  slug: string
  error: string | null
  onChange: (value: string) => void
  onContinue: () => void
}

/**
 * Passo 1: escolha do slug público.
 */
export function SlugStep({ slug, error, onChange, onContinue }: Props) {
  return (
    <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
      <label className="block text-sm">
        <span className="text-muted">Seu link</span>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-muted">linksnabio.app.br/</span>
          <input
            value={slug}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2"
            placeholder="minha-marca"
          />
        </div>
      </label>
      <ErrorText>{error}</ErrorText>
      <Button type="button" onClick={() => void onContinue()}>
        Continuar
      </Button>
    </div>
  )
}
