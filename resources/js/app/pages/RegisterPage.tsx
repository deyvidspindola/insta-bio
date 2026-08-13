import { AuthCard, Button, Field, GoogleButton } from '../../shared/ui'
import { csrfToken } from '../../shared/csrf'

/**
 * Tela de cadastro por e-mail/senha ou Google.
 */
export function RegisterPage() {
  return (
    <AuthCard title="Criar conta" subtitle="Comece no plano Free. Leva menos de 2 minutos.">
      <form className="space-y-4" method="POST" action="/cadastro">
        <input type="hidden" name="_token" value={csrfToken()} />
        <Field name="name" label="Nome" required />
        <Field name="email" type="email" label="E-mail" required />
        <Field name="password" type="password" label="Senha" required />
        <Field name="password_confirmation" type="password" label="Confirmar senha" required />
        <Button className="w-full" type="submit">
          Criar conta
        </Button>
      </form>
      <GoogleButton />
      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta?{' '}
        <a className="text-primary" href="/login">
          Entrar
        </a>
      </p>
    </AuthCard>
  )
}
