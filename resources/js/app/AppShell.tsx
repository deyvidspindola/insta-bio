import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { VerifyPage } from './pages/VerifyPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { SettingsPage } from './pages/SettingsPage'
import { FormSubmissionsPage } from './pages/FormSubmissionsPage'

/**
 * Roteamento simples por pathname para o SPA de auth/onboarding/settings.
 */
export function AppShell() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/login') return <LoginPage />
  if (path === '/cadastro') return <RegisterPage />
  if (path.startsWith('/email/verify')) return <VerifyPage />
  if (path === '/onboarding') return <OnboardingPage />
  if (path.startsWith('/app/respostas')) return <FormSubmissionsPage />
  if (path.startsWith('/app/configuracoes')) return <SettingsPage />

  return <LoginPage />
}
