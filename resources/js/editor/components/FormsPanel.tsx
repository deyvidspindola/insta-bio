import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import type { FormField, FormFieldType } from '@bio-types'
import type { UseBioFormsReturn } from '../hooks/useBioForms'
import { ConfirmDialog } from './ConfirmDialog'
import { Field } from './item-editors/Field'
import { FieldGroup } from './item-editors/FieldGroup'

interface FormsPanelProps {
  formsApi: UseBioFormsReturn
  onStatus: (message: string) => void
  onActionError: (message: string) => void
}

const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'textarea', label: 'Texto longo' },
]

function statusLabel(status: string): string {
  return status === 'published' ? 'Publicada' : 'Rascunho'
}

function newField(): FormField {
  return {
    id: `campo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'text',
    label: 'Novo campo',
    required: false,
  }
}

/**
 * Lista e edita formulários reutilizáveis (menu Formulários).
 */
export function FormsPanel({ formsApi, onStatus, onActionError }: FormsPanelProps) {
  const {
    forms,
    loading,
    selectedForm,
    draft,
    isDirty,
    saving,
    publishing,
    deleting,
    selectForm,
    updateDraft,
    createForm,
    saveDraft,
    publishForm,
    deleteForm,
  } = formsApi

  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creatingBusy, setCreatingBusy] = useState(false)
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null)
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false)

  const fields = draft.fields

  function patchField(index: number, patch: Partial<FormField>) {
    updateDraft((prev) => ({
      ...prev,
      fields: prev.fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    }))
  }

  function moveField(from: number, to: number) {
    if (to < 0 || to >= fields.length) return
    updateDraft((prev) => {
      const next = [...prev.fields]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return { ...prev, fields: next }
    })
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!newTitle.trim() || creatingBusy) return
    setCreatingBusy(true)
    try {
      await createForm(newTitle)
      setNewTitle('')
      setCreating(false)
      onStatus('Formulário criado')
    } catch (err) {
      onActionError(err instanceof Error ? err.message : 'Falha ao criar formulário')
    } finally {
      setCreatingBusy(false)
    }
  }

  async function handleSave() {
    try {
      await saveDraft()
      onStatus('Rascunho do formulário salvo')
    } catch (err) {
      onActionError(err instanceof Error ? err.message : 'Falha ao salvar formulário')
    }
  }

  async function handlePublish() {
    try {
      await publishForm()
      setConfirmPublishOpen(false)
      onStatus('Formulário publicado')
    } catch (err) {
      onActionError(err instanceof Error ? err.message : 'Falha ao publicar formulário')
    }
  }

  async function handleDelete() {
    if (!confirmDeleteSlug) return
    try {
      await deleteForm(confirmDeleteSlug)
      setConfirmDeleteSlug(null)
      onStatus('Formulário excluído')
    } catch (err) {
      onActionError(err instanceof Error ? err.message : 'Falha ao excluir formulário')
    }
  }

  if (selectedForm) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => selectForm(null)}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Todos os formulários
            </button>
            <h2 className="truncate text-base font-semibold">{draft.title || selectedForm.title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              /{selectedForm.slug} · {statusLabel(selectedForm.status)}
              {isDirty ? ' · alterações não salvas' : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
              onClick={() => void handleSave()}
              disabled={saving || publishing || !isDirty}
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Salvando…' : 'Salvar rascunho'}
            </button>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
              onClick={() => setConfirmPublishOpen(true)}
              disabled={saving || publishing}
            >
              <Globe className="h-3.5 w-3.5" />
              {publishing ? 'Publicando…' : 'Publicar'}
            </button>
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:text-red-400"
              onClick={() => setConfirmDeleteSlug(selectedForm.slug)}
              disabled={saving || publishing || deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </button>
          </div>
        </div>

        <FieldGroup title="Formulário">
          <Field label="Título">
            <input
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              placeholder="Ex.: Fale conosco"
              maxLength={120}
            />
          </Field>
          <Field label="Descrição (opcional)">
            <textarea
              rows={2}
              value={draft.description}
              onChange={(e) => updateDraft({ description: e.target.value })}
              placeholder="Texto curto acima dos campos"
            />
          </Field>
          <Field label="Texto do botão">
            <input
              value={draft.submitLabel}
              onChange={(e) => updateDraft({ submitLabel: e.target.value })}
              placeholder="Enviar"
            />
          </Field>
          <Field label="Mensagem de sucesso">
            <input
              value={draft.successMessage}
              onChange={(e) => updateDraft({ successMessage: e.target.value })}
              placeholder="Recebemos sua mensagem. Obrigado!"
            />
          </Field>
        </FieldGroup>

        <FieldGroup title="Campos">
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-2 rounded-lg border border-border/70 bg-background/30 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Campo {index + 1}
                  </p>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      className="btn-ghost p-1.5"
                      disabled={index === 0}
                      aria-label="Mover campo para cima"
                      onClick={() => moveField(index, index - 1)}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost p-1.5"
                      disabled={index === fields.length - 1}
                      aria-label="Mover campo para baixo"
                      onClick={() => moveField(index, index + 1)}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost p-1.5 text-muted-foreground hover:text-red-400"
                      aria-label="Remover campo"
                      onClick={() =>
                        updateDraft((prev) => ({
                          ...prev,
                          fields: prev.fields.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <Field label="Rótulo">
                  <input
                    value={field.label}
                    onChange={(e) => patchField(index, { label: e.target.value })}
                  />
                </Field>
                <Field label="Tipo">
                  <select
                    value={field.type}
                    onChange={(e) =>
                      patchField(index, { type: e.target.value as FormFieldType })
                    }
                  >
                    {FIELD_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Placeholder (opcional)">
                  <input
                    value={field.placeholder ?? ''}
                    onChange={(e) => patchField(index, { placeholder: e.target.value })}
                  />
                </Field>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(field.required)}
                    onChange={(e) => patchField(index, { required: e.target.checked })}
                  />
                  Obrigatório
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-secondary mt-2 flex w-full items-center justify-center gap-1.5 py-1.5 text-xs"
            onClick={() =>
              updateDraft((prev) => ({
                ...prev,
                fields: [...prev.fields, newField()],
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar campo
          </button>
        </FieldGroup>

        <ConfirmDialog
          open={confirmPublishOpen}
          title="Publicar formulário?"
          description={
            <>
              O rascunho atual será salvo e publicado. Cards da bio que usam este formulário
              passarão a exibir a versão publicada.
            </>
          }
          confirmLabel="Publicar"
          cancelLabel="Cancelar"
          loading={publishing}
          onConfirm={() => void handlePublish()}
          onCancel={() => {
            if (!publishing) setConfirmPublishOpen(false)
          }}
        />

        <ConfirmDialog
          open={confirmDeleteSlug !== null}
          title="Excluir formulário?"
          description="Esta ação não pode ser desfeita. Cards da bio que apontam para ele deixarão de funcionar."
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          loading={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => {
            if (!deleting) setConfirmDeleteSlug(null)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Formulários</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie formulários reutilizáveis e use-os como bloco na bio.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          onClick={() => setCreating(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Novo formulário
        </button>
      </div>

      {creating && (
        <form className="card space-y-3" onSubmit={(e) => void handleCreate(e)}>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium">Título</span>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex.: Contato, Orçamento, Lista de espera"
              maxLength={120}
              disabled={creatingBusy}
            />
            <span className="block text-[11px] text-muted-foreground">
              O slug é gerado a partir do título.
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="btn-primary px-3 py-1.5 text-xs"
              disabled={creatingBusy || !newTitle.trim()}
            >
              {creatingBusy ? 'Criando…' : 'Criar formulário'}
            </button>
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 text-xs"
              disabled={creatingBusy}
              onClick={() => {
                setCreating(false)
                setNewTitle('')
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="card flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando formulários…
        </div>
      )}

      {!loading && forms.length === 0 && !creating && (
        <div className="card py-12 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium">Nenhum formulário ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie um formulário e adicione-o como bloco na bio.
          </p>
        </div>
      )}

      {!loading && forms.length > 0 && (
        <ul className="space-y-2">
          {forms.map((form) => (
            <li key={form.slug} className="card !p-3 sm:!p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{form.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    /{form.slug}
                    <span className="mx-1.5 text-border">·</span>
                    <span
                      className={
                        form.status === 'published'
                          ? 'text-emerald-500'
                          : 'text-amber-600 dark:text-amber-400'
                      }
                    >
                      {statusLabel(form.status)}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    className="btn-secondary inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
                    onClick={() => selectForm(form.slug)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary inline-flex items-center justify-center px-2 py-1.5 text-xs text-red-500 hover:text-red-400"
                    onClick={() => setConfirmDeleteSlug(form.slug)}
                    aria-label={`Excluir ${form.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmDeleteSlug !== null}
        title="Excluir formulário?"
        description="Esta ação não pode ser desfeita. Cards da bio que apontam para ele deixarão de funcionar."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) setConfirmDeleteSlug(null)
        }}
      />
    </div>
  )
}
