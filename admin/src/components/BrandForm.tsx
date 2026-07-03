import type { BioBrand } from '@bio-types'
import { ColorField, GlowColorField } from './ColorField'
import { ImageField } from './ImageField'

interface BrandFormProps {
  brand: BioBrand
  onChange: (brand: BioBrand) => void
}

function update<K extends keyof BioBrand>(brand: BioBrand, key: K, value: BioBrand[K]) {
  return { ...brand, [key]: value }
}

export function BrandForm({ brand, onChange }: BrandFormProps) {
  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="mb-4 text-sm font-semibold">Identidade</h3>
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
          <div className="field">
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
              label="Capa opcional"
              value={brand.coverImage}
              onChange={(coverImage) => onChange(update(brand, 'coverImage', coverImage))}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-sm font-semibold">Tema & SEO</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField
            label="Cor primária"
            value={brand.theme.primary}
            onChange={(primary) =>
              onChange({
                ...brand,
                theme: { ...brand.theme, primary },
              })
            }
            hint="Usada em títulos, bordas e destaques"
          />
          <div className="sm:col-span-2">
            <GlowColorField
              label="Brilho de fundo"
              value={brand.theme.glow ?? ''}
              onChange={(glow) =>
                onChange({
                  ...brand,
                  theme: { ...brand.theme, glow: glow || undefined },
                })
              }
            />
          </div>
          <div className="field sm:col-span-2">
            <label>Título da página (SEO)</label>
            <input
              value={brand.seo.title}
              onChange={(e) =>
                onChange({ ...brand, seo: { ...brand.seo, title: e.target.value } })
              }
            />
          </div>
          <div className="field sm:col-span-2">
            <label>Descrição (SEO)</label>
            <textarea
              rows={3}
              value={brand.seo.description}
              onChange={(e) =>
                onChange({ ...brand, seo: { ...brand.seo, description: e.target.value } })
              }
            />
          </div>
          <div className="field sm:col-span-2">
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
