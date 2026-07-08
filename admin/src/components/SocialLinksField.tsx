import type { SocialLink, SocialNetwork } from '@bio-types'

export const SOCIAL_NETWORK_OPTIONS: { value: SocialNetwork; label: string; placeholder: string }[] = [
  { value: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/seuperfil' },
  { value: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@seuperfil' },
  { value: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@canal' },
  { value: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/pagina' },
  { value: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/5511999999999' },
  { value: 'email', label: 'E-mail', placeholder: 'contato@email.com' },
  { value: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/artist/...' },
]

type SocialLinksUpdater = SocialLink[] | ((prev: SocialLink[]) => SocialLink[])

interface SocialLinksFieldProps {
  value: SocialLink[]
  onChange: (links: SocialLinksUpdater) => void
}

export function SocialLinksField({ value, onChange }: SocialLinksFieldProps) {
  const links = value ?? []

  function applyChange(updater: SocialLinksUpdater) {
    const next = typeof updater === 'function' ? updater(links) : updater
    onChange(next)
  }

  function updateLink(index: number, patch: Partial<SocialLink>) {
    applyChange((prev) => prev.map((link, i) => (i === index ? { ...link, ...patch } : link)))
  }

  function removeLink(index: number) {
    applyChange((prev) => prev.filter((_, i) => i !== index))
  }

  function addLink() {
    applyChange((prev) => {
      const used = new Set(prev.map((l) => l.network))
      const next = SOCIAL_NETWORK_OPTIONS.find((o) => !used.has(o.value))
      return [...prev, { network: next?.value ?? 'instagram', url: '' }]
    })
  }

  return (
    <div className="field">
      <label>Redes sociais no topo</label>
      <p className="mb-3 text-[10px] text-muted-foreground/80">
        Ícones no header, abaixo do nome e da localização — com ou sem capa.
      </p>
      <div className="space-y-2">
        {links.length === 0 && (
          <p className="text-xs text-muted-foreground/70">Nenhuma rede adicionada.</p>
        )}
        {links.map((link, index) => {
          const option = SOCIAL_NETWORK_OPTIONS.find((o) => o.value === link.network)
          return (
            <div
              key={`social-link-${index}`}
              className="social-link-row grid grid-cols-[9rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-muted/40 p-3"
            >
              <select
                value={link.network}
                onChange={(e) => updateLink(index, { network: e.target.value as SocialNetwork })}
                aria-label="Rede social"
              >
                {SOCIAL_NETWORK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                value={link.url}
                placeholder={option?.placeholder ?? 'https://'}
                onChange={(e) => updateLink(index, { url: e.target.value })}
                aria-label="URL da rede social"
              />
              <button
                type="button"
                className="btn-danger shrink-0 px-2.5 py-1.5 text-xs whitespace-nowrap"
                onClick={() => removeLink(index)}
                aria-label="Remover rede"
              >
                Remover
              </button>
            </div>
          )
        })}
      </div>
      <button type="button" className="btn-secondary mt-2 w-full py-1.5 text-xs" onClick={addLink}>
        + Adicionar rede
      </button>
    </div>
  )
}
