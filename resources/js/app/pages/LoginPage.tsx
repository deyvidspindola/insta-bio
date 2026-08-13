import { AuthCard, Button, Field, GoogleButton } from '../../shared/ui'
import { csrfToken } from '../../shared/csrf'

/**
 * Tela de login por e-mail/senha ou Google.
 */
export function LoginPage() {
  return (
    <AuthCard title="Entrar" subtitle="Acesse o editor da sua bio.">
      <form className="space-y-4" method="POST" action="/login">
        <input type="hidden" name="_token" value={csrfToken()} />
        <Field name="email" type="email" label="E-mail" required />
        <Field name="password" type="password" label="Senha" required />
        <Button className="w-full" type="submit">
          Entrar
        </Button>
      </form>
      <GoogleButton />
      <p className="mt-6 text-center text-sm text-muted">
        Não tem conta?{' '}
        <a className="text-primary" href="/cadastro">
          Criar grátis
        </a>
      </p>
    </AuthCard>
  )
}
