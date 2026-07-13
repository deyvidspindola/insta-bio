import type { BioBrand } from '@bio-types'
import { pageDescription, pageTitle, syncBrandSeo } from '@site/lib/pageMeta'
import { normalizeBrandSocial, syncBrandSocialLinks } from '@site/lib/socialLinks'
import { ImageField } from './ImageField'
import { SocialLinksField } from './SocialLinksField'

interface IdentityFormProps {
  brand: BioBrand
  onChange: (brand: BioBrand) => void
}

function update<K extends keyof BioBrand>(brand: BioBrand, key: K, value: BioBrand[K]) {
  return { ...brand, [key]: value }
}

export function IdentityForm({ brand, onChange }: IdentityFormProps) {
  const socialLinks = brand.socialLinks?.length
    ? brand.socialLinks
    : normalizeBrandSocial(brand).socialLinks!

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="mb-1 text-sm font-semibold">Perfil</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Nome, logo e redes — o que aparece no topo da bio.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="field sm:col-span-2">
            <label>Nome</label>
            <input
              value={brand.name}
              onChange={(e) => onChange(syncBrandSeo(update(brand, 'name', e.target.value)))}
            />
          </div>
          <div className="field sm:col-span-2">
            <label>Tagline</label>
            <textarea
              rows={3}
              value={brand.tagline ?? ''}
              onChange={(e) => onChange(syncBrandSeo(update(brand, 'tagline', e.target.value)))}
              placeholder={'Ex.: Terça a Sexta — 11h às 18:30\nSábado e Domingo — 11h às 16h'}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Enter cria uma nova linha na bio.
            </p>
          </div>
          <div className="field sm:col-span-2">
            <label>Localização</label>
            <input
              value={brand.location}
              onChange={(e) => onChange(update(brand, 'location', e.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <ImageField
              label="Logo"
              value={brand.logo}
              onChange={(logo) => onChange(update(brand, 'logo', logo ?? ''))}
            />
          </div>
          <div className="sm:col-span-2">
            <ImageField
              label="Capa do topo (banner)"
              value={brand.coverImage}
              onChange={(coverImage) => onChange(update(brand, 'coverImage', coverImage))}
              hint="Banner horizontal no topo. As redes sociais ficam abaixo do nome e da localização."
            />
          </div>
          <div className="sm:col-span-2">
            <SocialLinksField
              value={socialLinks}
              onChange={(socialLinksUpdater) => {
                const resolved =
                  typeof socialLinksUpdater === 'function'
                    ? socialLinksUpdater(socialLinks)
                    : socialLinksUpdater
                onChange(syncBrandSocialLinks(brand, resolved))
              }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-semibold">SEO e rodapé</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          O título da aba e a descrição para buscadores usam automaticamente o Nome e a
          Tagline. O ícone da aba usa o Logo.
        </p>
        <dl className="mb-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Título da página</dt>
            <dd className="font-medium">{pageTitle(brand)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Descrição</dt>
            <dd className="text-muted-foreground">{pageDescription(brand)}</dd>
          </div>
        </dl>
        <div className="grid grid-cols-1 gap-3">
          <div className="field">
            <label>Rodapé</label>
            <input
              value={brand.footer}
              onChange={(e) => onChange(update(brand, 'footer', e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
