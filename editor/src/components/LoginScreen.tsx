import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { login } from '../lib/auth'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  onSuccess: () => void
}

function prefillUsername(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('user') ?? params.get('email') ?? ''
}

export function LoginScreen({ onSuccess }: Props) {
  const [username, setUsername] = useState(prefillUsername)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)

  // Só no mount: se a URL já trouxe o e-mail (?user= / ?email=), vai para a senha.
  // Não depende de `username` — senão cada tecla rouba o foco do e-mail.
  useEffect(() => {
    if (prefillUsername()) {
      passwordRef.current?.focus()
    } else {
      usernameRef.current?.focus()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              links na bio · editor
            </p>
            <h1 className="text-xl font-semibold leading-tight">Entrar</h1>
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Acesso restrito para editar links e textos da bio.
        </p>

        <div className="space-y-5">
          <div className="field mb-0">
            <label htmlFor="login-username">E-mail</label>
            <input
              ref={usernameRef}
              id="login-username"
              type="email"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="field mb-0">
            <label htmlFor="login-password">Senha</label>
            <input
              ref={passwordRef}
              id="login-password"
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

        <button
          type="submit"
          className="btn-primary mt-6 w-full"
          disabled={loading}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
