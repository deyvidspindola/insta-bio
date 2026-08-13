import { BIO_TEMPLATE_LIST } from '@site/lib/templates'
import { Button } from '../../shared/ui'

const FREE_TEMPLATES = new Set(['classic', 'pill', 'soft'])

type Pack = { id: string; name: string; niche: string }

type Props = {
  template: string
  packId: string
  packs: Pack[]
  onTemplate: (id: string) => void
  onPack: (id: string) => void
  onContinue: () => void
}

/**
 * Passo 2: layout Free e paleta de cores.
 */
export function LayoutStep({ template, packId, packs, onTemplate, onPack, onContinue }: Props) {
  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="font-medium">Layout (Free: Clássico, Pill e Soft)</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BIO_TEMPLATE_LIST.filter((item) => FREE_TEMPLATES.has(item.id)).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTemplate(item.id)}
              className={`rounded-xl border p-3 text-left text-sm ${template === item.id ? 'border-primary' : 'border-border'}`}
            >
              <strong>{item.label}</strong>
              <p className="mt-1 text-muted">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-medium">Inspiração de cores</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {packs.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => onPack(pack.id)}
              className={`rounded-xl border p-3 text-left text-sm ${packId === pack.id ? 'border-primary' : 'border-border'}`}
            >
              <strong>{pack.name}</strong>
              <p className="mt-1 text-muted">{pack.niche}</p>
            </button>
          ))}
        </div>
      </div>
      <Button type="button" onClick={onContinue}>
        Continuar
      </Button>
    </div>
  )
}
