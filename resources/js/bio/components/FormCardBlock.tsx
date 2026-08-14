import { useEffect, useState } from 'react'
import type { FormCard as FormCardType, FormField } from '../types/bio'
import { BioFormFields, FormModal, fetchPublishedForm, type ResolvedFormDefinition } from './FormModal'

function definitionFromInline(item: FormCardType): ResolvedFormDefinition {
  return {
    slug: item.formSlug?.trim() || '',
    title: item.title?.trim() || 'Formulário',
    description: item.description,
    fields: (item.fields ?? []) as FormField[],
    submitLabel: item.submitLabel,
    successMessage: item.successMessage,
  }
}

/**
 * Bloco de formulário: embutido na bio ou botão que abre modal.
 */
export function FormCardBlock({
  item,
  sectionId,
  itemIndex,
}: {
  item: FormCardType
  sectionId: string
  itemIndex: number
}) {
  const formSlug = item.formSlug?.trim() || ''
  const display = item.display === 'modal' ? 'modal' : 'embed'
  const [definition, setDefinition] = useState<ResolvedFormDefinition | null>(() =>
    formSlug ? null : definitionFromInline(item),
  )
  const [loading, setLoading] = useState(Boolean(formSlug))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!formSlug) {
      setDefinition(definitionFromInline(item))
      setLoading(false)
      setLoadError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)
    void fetchPublishedForm(formSlug)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          // Preview do editor: usa título local se a publicação ainda não existir.
          setDefinition({
            slug: formSlug,
            title: item.title?.trim() || formSlug,
            description: item.description,
            fields: item.fields ?? [],
            submitLabel: item.submitLabel,
            successMessage: item.successMessage,
          })
          setLoadError(null)
          return
        }
        setDefinition(data)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Não foi possível carregar o formulário.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [formSlug, item.title, item.description, item.fields, item.submitLabel, item.successMessage])

  if (loading) {
    return (
      <div className="bio-card bio-form-card px-4 py-5">
        <p className="text-xs text-muted-foreground">Carregando formulário…</p>
      </div>
    )
  }

  if (!definition || (formSlug && definition.fields.length === 0 && loadError)) {
    return (
      <div className="bio-card bio-form-card px-4 py-5">
        <p className="text-xs text-muted-foreground">
          {loadError || 'Selecione um formulário publicado no editor.'}
        </p>
      </div>
    )
  }

  if (display === 'modal') {
    return (
      <>
        <button
          type="button"
          className="bio-card bio-form-card bio-form-modal-trigger w-full px-4 py-4 text-left"
          onClick={() => setModalOpen(true)}
        >
          <span className="text-sm font-bold text-foreground">
            {item.buttonLabel?.trim() || definition.title || 'Abrir formulário'}
          </span>
          {(item.description || definition.description)?.trim() && (
            <span className="mt-1 block text-xs text-muted-foreground">
              {(item.description || definition.description)?.trim()}
            </span>
          )}
        </button>
        <FormModal
          open={modalOpen}
          definition={definition}
          sectionId={sectionId}
          itemIndex={itemIndex}
          onClose={() => setModalOpen(false)}
        />
      </>
    )
  }

  return (
    <div className="bio-card bio-form-card px-4 py-4">
      <BioFormFields definition={definition} sectionId={sectionId} itemIndex={itemIndex} />
    </div>
  )
}
