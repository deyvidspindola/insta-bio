import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { LINKS, NAV } from '../data/content'

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${
        scrolled || open ? 'border-b border-line bg-base/95 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="container-site flex h-14 items-center justify-between gap-4 sm:h-16">
        <a href="#" className="flex items-center gap-2">
          <img src="/logo-instabio.svg" alt="" width={28} height={28} className="size-7 rounded-md" />
          <span className="font-display text-sm font-semibold tracking-tight text-text">
            links na bio
          </span>
        </a>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-text"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={LINKS.login}
            className="text-sm text-muted transition-colors hover:text-text"
          >
            Entrar
          </a>
          <a
            href={LINKS.cta}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-base transition-colors hover:bg-accent-hover"
          >
            Criar conta grátis
          </a>
        </div>

        <button
          type="button"
          className="inline-flex size-9 items-center justify-center text-text md:hidden"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-base md:hidden">
          <nav className="container-site flex flex-col py-3" aria-label="Mobile">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="py-3 text-base text-muted"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href={LINKS.cta}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 mb-2 inline-flex justify-center rounded-full bg-accent py-3 text-sm font-semibold text-base"
              onClick={() => setOpen(false)}
            >
              Ativar vitrine
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
