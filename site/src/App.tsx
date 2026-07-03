import { useEffect, useMemo } from 'react'
import rawTemplate from './template-home.html?raw'

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
      document.dispatchEvent(new Event('DOMContentLoaded'))
      window.dispatchEvent(new Event('load'))
      // Tema padrão escuro; usuário pode alternar para claro pelo botão fixo
      if (localStorage.getItem('color-theme') !== 'light') {
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
        localStorage.setItem('color-theme', 'dark')
      }
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
