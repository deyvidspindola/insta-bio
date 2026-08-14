import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { VerifyPage } from './pages/VerifyPage'
import { OnboardingPage } from './pages/OnboardingPage'

/**
 * Roteamento simples por pathname para o SPA de auth/onboarding.
 * Respostas, funil e conta ficam no layout do editor (/app).
 */
export function AppShell() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/login') return <LoginPage />
  if (path === '/cadastro') return <RegisterPage />
  if (path.startsWith('/email/verify')) return <VerifyPage />
  if (path === '/onboarding') return <OnboardingPage />

  return <LoginPage />
}
