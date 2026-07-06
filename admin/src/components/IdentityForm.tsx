import type { BioBrand } from '@bio-types'
import { ImageField } from './ImageField'

interface IdentityFormProps {
  brand: BioBrand
  onChange: (brand: BioBrand) => void
}

function update<K extends keyof BioBrand>(brand: BioBrand, key: K, value: BioBrand[K]) {
  return { ...brand, [key]: value }
}

export function IdentityForm({ brand, onChange }: IdentityFormProps) {
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
              onChange={(e) => onChange(update(brand, 'name', e.target.value))}
            />
          </div>
          <div className="field sm:col-span-2">
            <label>Tagline</label>
            <input
              value={brand.tagline ?? ''}
              onChange={(e) => onChange(update(brand, 'tagline', e.target.value))}
            />
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
          <div className="field">
            <label>Instagram @</label>
            <input
              value={brand.instagram.handle}
              onChange={(e) =>
                onChange({
                  ...brand,
                  instagram: { ...brand.instagram, handle: e.target.value },
                })
              }
            />
          </div>
          <div className="field">
            <label>Instagram URL</label>
            <input
              value={brand.instagram.url}
              onChange={(e) =>
                onChange({
                  ...brand,
                  instagram: { ...brand.instagram, url: e.target.value },
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <ImageField
              label="Capa do topo (banner)"
              value={brand.coverImage}
              onChange={(coverImage) => onChange(update(brand, 'coverImage', coverImage))}
              hint="Banner horizontal acima do logo. Opcional."
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-semibold">SEO e rodapé</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Título e descrição para buscadores e texto no fim da página.
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div className="field">
            <label>Título da página (SEO)</label>
            <input
              value={brand.seo.title}
              onChange={(e) =>
                onChange({ ...brand, seo: { ...brand.seo, title: e.target.value } })
              }
            />
          </div>
          <div className="field">
            <label>Descrição (SEO)</label>
            <textarea
              rows={3}
              value={brand.seo.description}
              onChange={(e) =>
                onChange({ ...brand, seo: { ...brand.seo, description: e.target.value } })
              }
            />
          </div>
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
