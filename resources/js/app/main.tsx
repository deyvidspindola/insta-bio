import { createRoot } from 'react-dom/client'
import './index.css'
import { AppShell } from './AppShell'

/** Ponto de entrada do SPA de auth, onboarding e configurações. */
createRoot(document.getElementById('root')!).render(<AppShell />)
