import { AuthCard, Button } from '../../shared/ui'
import { csrfToken } from '../../shared/csrf'

/**
 * Pedido para confirmar o e-mail após o cadastro.
 */
export function VerifyPage() {
  return (
    <AuthCard title="Confirme seu e-mail" subtitle="Enviamos um link de verificação. Confira a caixa de entrada (e o spam).">
      <form method="POST" action="/email/verification-notification">
        <input type="hidden" name="_token" value={csrfToken()} />
        <Button className="w-full" type="submit">
          Reenviar e-mail
        </Button>
      </form>
    </AuthCard>
  )
}
