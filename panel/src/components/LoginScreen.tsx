import { useState } from 'react'
import { login } from '../lib/auth'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  onSuccess: () => void
}

export function LoginScreen({ onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 0%, color-mix(in oklch, var(--color-primary) 28%, transparent), transparent 70%)',
        }}
      />

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <form
        onSubmit={handleSubmit}
        className="card relative w-full max-w-md p-8 shadow-xl shadow-black/20"
      >
        <div className="mb-8 flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}logo-instabio.svg`}
            alt="Links na Bio"
            className="h-11 w-11 shrink-0 rounded-xl shadow-sm"
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              Links na Bio
            </p>
            <h1 className="text-xl font-semibold leading-tight">Painel da plataforma</h1>
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Acesso restrito para cadastrar e gerenciar clientes.
        </p>

        <div className="space-y-5">
          <div className="field mb-0">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
            />
          </div>

          <div className="field mb-0">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
