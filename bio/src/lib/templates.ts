import type { BioTemplate } from '../types/bio'

export const DEFAULT_BIO_TEMPLATE: BioTemplate = 'classic'

export const BIO_TEMPLATES: Record<
  BioTemplate,
  { label: string; description: string; previewClass: string }
> = {
  classic: {
    label: 'Clássico',
    description: 'Links simples com borda escura.',
    previewClass: 'bio-tpl-preview-classic',
  },
  pill: {
    label: 'Pill',
    description: 'Links simples em pílula (1 coluna).',
    previewClass: 'bio-tpl-preview-pill',
  },
  outline: {
    label: 'Contorno',
    description: 'Links simples vazados com borda.',
    previewClass: 'bio-tpl-preview-outline',
  },
  solid: {
    label: 'Sólido',
    description: 'Links simples preenchidos com cor primária.',
    previewClass: 'bio-tpl-preview-solid',
  },
  glass: {
    label: 'Glass',
    description: 'Links simples com efeito vidro.',
    previewClass: 'bio-tpl-preview-glass',
  },
  soft: {
    label: 'Soft',
    description: 'Links simples com sombra suave.',
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
