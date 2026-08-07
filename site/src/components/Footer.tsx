import { LINKS } from '../data/content'

export function Footer() {
  return (
    <footer className="border-t border-line bg-base pb-8 pt-8">
      <div className="container-site flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <a href="#" className="flex items-center gap-2">
          <img src="/logo-instabio.svg" alt="" width={24} height={24} className="size-6 rounded" />
          <span className="font-display text-sm font-semibold text-text">links na bio</span>
        </a>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-text">
            Instagram
          </a>
          <a href={LINKS.support} target="_blank" rel="noopener noreferrer" className="hover:text-text">
            WhatsApp
          </a>
          <a href={LINKS.terms} target="_blank" rel="noopener noreferrer" className="hover:text-text">
            Termos
          </a>
          <a href={LINKS.privacy} target="_blank" rel="noopener noreferrer" className="hover:text-text">
            Privacidade
          </a>
        </nav>
      </div>
    </footer>
  )
}
