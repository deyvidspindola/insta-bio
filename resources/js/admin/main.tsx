import { createRoot } from 'react-dom/client'
import '../app/index.css'
import { AdminApp } from './AdminApp'

/** Ponto de entrada do SPA admin. */
createRoot(document.getElementById('root')!).render(<AdminApp />)
