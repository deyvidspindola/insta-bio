import type { BioBrand, BioTemplate } from '@bio-types'
import { BIO_TEMPLATE_LIST, DEFAULT_BIO_TEMPLATE } from '@site/lib/templates'
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
  const activeTemplate = brand.template ?? DEFAULT_BIO_TEMPLATE

  function setTemplate(template: BioTemplate) {
    onChange({ ...brand, template })
  }

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
              label="Capa do topo (banner)"
              value={brand.coverImage}
              onChange={(coverImage) => onChange(update(brand, 'coverImage', coverImage))}
              hint="Banner horizontal acima do logo. Opcional."
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-semibold">Visual da página</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Escolha o estilo dos cards e personalize o fundo da bio.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BIO_TEMPLATE_LIST.map((item) => {
            const selected = activeTemplate === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTemplate(item.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                    : 'border-border bg-background/40 hover:border-primary/40'
                }`}
              >
                <div className={`bio-tpl-preview ${item.previewClass} mb-2`}>
                  <span />
                  <span />
                  <span />
                </div>
                <span className="block text-xs font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                  {item.description}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField
            label="Cor de fundo"
            value={brand.theme.background ?? ''}
            onChange={(background) =>
              onChange({
                ...brand,
                theme: { ...brand.theme, background: background || undefined },
              })
            }
            hint="Deixe vazio para usar o fundo escuro padrão"
          />
          <div className="sm:col-span-2">
            <ImageField
              label="Imagem de fundo (página inteira)"
              value={brand.theme.backgroundImage}
              onChange={(backgroundImage) =>
                onChange({
                  ...brand,
                  theme: { ...brand.theme, backgroundImage: backgroundImage || undefined },
                })
              }
              hint="Cobre toda a tela com overlay para legibilidade. Substitui o brilho no topo."
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
            hint="Botões, destaques e títulos de seção"
          />
          <ColorField
            label="Cor secundária"
            value={brand.theme.secondary ?? ''}
            onChange={(secondary) =>
              onChange({
                ...brand,
                theme: { ...brand.theme, secondary: secondary || undefined },
              })
            }
            hint="Tagline, subtítulos de seção e textos de apoio"
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
