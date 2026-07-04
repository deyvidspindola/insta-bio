import type { BioTemplate } from '../types/bio'

export const DEFAULT_BIO_TEMPLATE: BioTemplate = 'classic'

export const BIO_TEMPLATES: Record<
  BioTemplate,
  { label: string; description: string; previewClass: string }
> = {
  classic: {
    label: 'Clássico',
    description: 'Cards escuros com borda — estilo padrão.',
    previewClass: 'bio-tpl-preview-classic',
  },
  pill: {
    label: 'Pill',
    description: 'Links em pílulas coloridas, estilo Linktree.',
    previewClass: 'bio-tpl-preview-pill',
  },
  outline: {
    label: 'Contorno',
    description: 'Botões vazados só com borda colorida.',
    previewClass: 'bio-tpl-preview-outline',
  },
  solid: {
    label: 'Sólido',
    description: 'Blocos preenchidos com a cor primária.',
    previewClass: 'bio-tpl-preview-solid',
  },
  glass: {
    label: 'Glass',
    description: 'Vidro fosco com blur e transparência.',
    previewClass: 'bio-tpl-preview-glass',
  },
  soft: {
    label: 'Soft',
    description: 'Cantos grandes e sombras suaves.',
    previewClass: 'bio-tpl-preview-soft',
  },
}

export const BIO_TEMPLATE_LIST = (
  Object.entries(BIO_TEMPLATES) as Array<[BioTemplate, (typeof BIO_TEMPLATES)[BioTemplate]]>
).map(([id, meta]) => ({ id, ...meta }))

/** Templates antigos ainda presentes em bio.json salvos */
const LEGACY_TEMPLATES: Record<string, BioTemplate> = {
  minimal: 'outline',
}

export function resolveBioTemplate(template?: string): BioTemplate {
  if (!template) return DEFAULT_BIO_TEMPLATE
  if (template in LEGACY_TEMPLATES) return LEGACY_TEMPLATES[template]
  if (template in BIO_TEMPLATES) return template as BioTemplate
  return DEFAULT_BIO_TEMPLATE
}
