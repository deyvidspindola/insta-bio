import { useEffect, useMemo } from 'react'
import rawTemplate from './template-home.html?raw'
import { WHATSAPP_URLS } from './config'

const VENDOR_SCRIPTS = [
  '/template/vendor/swiper.min.js',
  '/template/vendor/leaflet.min.js',
  '/template/vendor/vanilla-infinite-marquee.min.js',
  '/template/vendor/split-text.min.js',
  '/template/vendor/gsap.min.js',
  '/template/vendor/scroll-trigger.min.js',
  '/template/vendor/draw-svg.min.js',
  '/template/vendor/motionpathplugin.min.js',
  '/template/vendor/lenis.min.js',
  '/template/vendor/springer.min.js',
  '/template/vendor/number-counter.js',
  '/template/vendor/stack-card.min.js',
  '/template/assets/main.js',
]

function buildMarkup(): string {
  const bodyMatch = rawTemplate.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  let html = bodyMatch ? bodyMatch[1] : rawTemplate

  // Remove scripts (carregados manualmente depois) e comentários
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<!--[\s\S]*?-->/g, '')

  // Remove placeholders do motor de template que não foram renderizados ({=$...})
  html = html.replace(/\{=\$[^}]*\}/g, '')

  // Ajusta caminhos de assets para /template/...
  html = html.replace(
    /(src|href)="(\.\/)?(images|assets|vendor|fonts)\//gi,
    '$1="/template/$3/',
  )

  // Neutraliza links internos para páginas .html que não existem aqui
  html = html.replace(/href="[^"]*\.html[^"]*"/gi, 'href="#"')

  return html
}

function loadScriptsSequentially(urls: string[]): Promise<void> {
  return urls.reduce<Promise<void>>((chain, url) => {
    return chain.then(
      () =>
        new Promise<void>((resolve) => {
          const script = document.createElement('script')
          script.src = url
          script.async = false
          script.dataset.templateScript = 'true'
          script.onload = () => resolve()
          script.onerror = () => resolve()
          document.body.appendChild(script)
        }),
    )
  }, Promise.resolve())
}

export default function App() {
  const markup = useMemo(buildMarkup, [])

  useEffect(() => {
    let cancelled = false

    loadScriptsSequentially(VENDOR_SCRIPTS).then(() => {
      if (cancelled) return
        document.querySelectorAll<HTMLAnchorElement>('[data-demo-link]').forEach((link) => {
        link.href = WHATSAPP_URLS.demo
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
      })

      document.querySelectorAll<HTMLButtonElement>('[data-editor-tab]').forEach((tab) => {
        tab.addEventListener('click', () => {
          const id = tab.getAttribute('data-editor-tab')
          if (!id) return
          document.querySelectorAll('[data-editor-tab]').forEach((el) => {
            const active = el === tab
            el.classList.toggle('site-editor-nav__item--active', active)
            el.setAttribute('aria-selected', active ? 'true' : 'false')
          })
          document.querySelectorAll('[data-editor-panel]').forEach((panel) => {
            const match = panel.getAttribute('data-editor-panel') === id
            if (match) panel.removeAttribute('hidden')
            else panel.setAttribute('hidden', '')
          })
        })
      })

      document.dispatchEvent(new Event('DOMContentLoaded'))
      window.dispatchEvent(new Event('load'))
      // Landing sempre em modo claro
      localStorage.setItem('color-theme', 'light')
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    })

    return () => {
      cancelled = true
      document
        .querySelectorAll('script[data-template-script="true"]')
        .forEach((el) => el.remove())
    }
  }, [])

  return <div dangerouslySetInnerHTML={{ __html: markup }} />
}
