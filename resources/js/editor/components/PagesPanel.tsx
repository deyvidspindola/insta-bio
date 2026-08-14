import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import type { BioBrand, BioSection } from '@bio-types'
import {
  createDefaultSection,
  createSection,
  createSimpleLink,
} from '../lib/bio'
import type { UseBioPagesReturn } from '../hooks/useBioPages'
import { ConfirmDialog } from './ConfirmDialog'
import { QuickAddLink } from './QuickAddLink'
import { SectionEditor } from './SectionEditor'
import { SectionMobilePicker, SectionSidebar } from './SectionSidebar'

interface PagesPanelProps {
  brand: BioBrand
  pagesApi: UseBioPagesReturn
  activeSection: number
  onActiveSectionChange: (index: number) => void
  onFocusItem: (index: number | null) => void
  openItemRequest: { sectionId: string; index: number; nonce: number } | null
  onClearOpenItemRequest: () => void
  dragIndex: number | null
  dropIndex: number | null
  onDragStart: (index: number | null) => void
  onDragOver: (index: number) => void
  onClearDrag: () => void
  onStatus: (message: string) => void
  onActionError: (message: string) => void
}

/**
 * Lista e edita páginas internas reusando SectionEditor / SectionSidebar.
 * Salvar já disponibiliza a página na bio — sem passo "Publicar".
 */
export function PagesPanel({
  brand,
  pagesApi,
  activeSection,
  onActiveSectionChange,
  onFocusItem,
  openItemRequest,
  onClearOpenItemRequest,
  dragIndex,
  dropIndex,
  onDragStart,
  onDragOver,
  onClearDrag,
  onStatus,
  onActionError,
}: PagesPanelProps) {
  const {
    pages,
    loading,
    selectedPage,
    draftSections,
    isDirty,
    saving,
    deleting,
    selectPage,
    updateDraftSections,
    createPage,
    saveDraft,
    deletePage,
  } = pagesApi

  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creatingBusy, setCreatingBusy] = useState(false)
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null)

  function commitSections(next: BioSection[]) {
    updateDraftSections(next)
  }

  function reorderSections(from: number, to: number) {
    if (from === to) return
    updateDraftSections((prev) => {
      const sections = [...prev]
      const [moved] = sections.splice(from, 1)
      sections.splice(to, 0, moved)
      return sections
    })
    onActiveSectionChange(to)
    onFocusItem(null)
  }

  function addSection() {
    updateDraftSections((prev) => [...prev, createSection()])
    onActiveSectionChange(draftSections.length)
    onFocusItem(null)
  }

  function addFirstLink(title: string, url: string) {
    commitSections([
      { ...createDefaultSection(), items: [createSimpleLink(title, url)] },
    ])
    onActiveSectionChange(0)
    onFocusItem(0)
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!newTitle.trim() || creatingBusy) return
    setCreatingBusy(true)
    try {
      await createPage(newTitle)
      setNewTitle('')
      setCreating(false)
      onActiveSectionChange(0)
      onFocusItem(null)
      onStatus('Página criada')
    } catch (err) {
      onActionError(err instanceof Error ? err.message : 'Falha ao criar página')
    } finally {
      setCreatingBusy(false)
    }
  }

  async function handleSave() {
    try {
      await saveDraft()
      onStatus('Página salva')
    } catch (err) {
      onActionError(err instanceof Error ? err.message : 'Falha ao salvar página')
    }
  }

  async function handleDelete() {
    if (!confirmDeleteSlug) return
    try {
      await deletePage(confirmDeleteSlug)
      setConfirmDeleteSlug(null)
      onStatus('Página excluída')
    } catch (err) {
      onActionError(err instanceof Error ? err.message : 'Falha ao excluir página')
    }
  }

  function backToList() {
    selectPage(null)
    onActiveSectionChange(0)
    onFocusItem(null)
    onClearOpenItemRequest()
  }

  if (selectedPage) {
    const safeActive =
      draftSections.length === 0
        ? 0
        : Math.min(activeSection, draftSections.length - 1)
    const currentSection = draftSections[safeActive]

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={backToList}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Todas as páginas
            </button>
            <h2 className="truncate text-base font-semibold">{selectedPage.title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              /{selectedPage.slug}
              {isDirty ? ' · alterações não salvas' : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-primary min-h-10 shrink-0 px-2.5 py-2 text-xs sm:px-3 sm:py-1.5"
              onClick={() => void handleSave()}
              disabled={saving || !isDirty}
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{saving ? 'Salvando…' : 'Salvar'}</span>
            </button>
            <button
              type="button"
              className="btn-danger min-h-10 shrink-0 px-2.5 py-2 text-xs sm:px-3 sm:py-1.5"
              onClick={() => setConfirmDeleteSlug(selectedPage.slug)}
              disabled={saving || deleting}
              aria-label="Remover"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Remover</span>
            </button>
          </div>
        </div>

        {draftSections.length === 0 && (
          <div className="mx-auto max-w-lg space-y-4">
            <div className="px-1 text-center">
              <h3 className="text-sm font-semibold">Conteúdo da página</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Adicione o primeiro link ou um grupo de blocos — o visual usa a marca da bio.
              </p>
            </div>
            <QuickAddLink onAdd={addFirstLink} />
            <div className="text-center">
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
                onClick={addSection}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar grupo vazio
              </button>
            </div>
          </div>
        )}

        {draftSections.length > 0 && (
          <>
            {draftSections.length > 1 && (
              <SectionMobilePicker
                sections={draftSections}
                activeSection={safeActive}
                onSelect={(index) => {
                  onActiveSectionChange(index)
                  onFocusItem(null)
                }}
                onAdd={addSection}
                onReorder={reorderSections}
              />
            )}
            <div
              className={`grid min-w-0 grid-cols-1 gap-4 ${
                draftSections.length > 1 ? 'md:grid-cols-[210px_minmax(0,1fr)]' : ''
              }`}
            >
              {draftSections.length > 1 && (
                <div className="hidden md:block">
                  <SectionSidebar
                    sections={draftSections}
                    activeSection={safeActive}
                    dragIndex={dragIndex}
                    dropIndex={dropIndex}
                    onSelect={(index) => {
                      onActiveSectionChange(index)
                      onFocusItem(null)
                    }}
                    onReorder={reorderSections}
                    onAdd={addSection}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={(index) => {
                      if (dragIndex !== null) reorderSections(dragIndex, index)
                      onClearDrag()
                    }}
                    onDragEnd={onClearDrag}
                  />
                </div>
              )}

              {currentSection && (
                <SectionEditor
                  section={currentSection}
                  theme={brand.theme}
                  isOnlySection={draftSections.length <= 1}
                  onAddSection={addSection}
                  onChange={(nextSection) => {
                    updateDraftSections((prev) => {
                      const sections = [...prev]
                      sections[safeActive] = nextSection
                      return sections
                    })
                  }}
                  onFocusItem={onFocusItem}
                  openItemRequest={
                    openItemRequest && openItemRequest.sectionId === currentSection.id
                      ? { index: openItemRequest.index, nonce: openItemRequest.nonce }
                      : null
                  }
                  onRemove={() => {
                    updateDraftSections((prev) => prev.filter((_, i) => i !== safeActive))
                    onActiveSectionChange(Math.max(0, safeActive - 1))
                    onFocusItem(null)
                    onClearOpenItemRequest()
                  }}
                />
              )}
            </div>
          </>
        )}

        <ConfirmDialog
          open={confirmDeleteSlug !== null}
          title="Excluir página?"
          description="Esta ação não pode ser desfeita. Links da bio que apontam para ela deixarão de abrir a página."
          confirmLabel="Remover"
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
          <h2 className="text-base font-semibold">Páginas internas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Subpáginas com os mesmos blocos da bio — um nível só, sem páginas dentro de
            páginas.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          onClick={() => setCreating(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Nova página
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
              placeholder="Ex.: Catálogo, Sobre, Contato"
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
              {creatingBusy ? 'Criando…' : 'Criar página'}
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
          Carregando páginas…
        </div>
      )}

      {!loading && pages.length === 0 && !creating && (
        <div className="card py-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium">Nenhuma página ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie uma página e aponte cards da bio para ela.
          </p>
        </div>
      )}

      {!loading && pages.length > 0 && (
        <ul className="space-y-2">
          {pages.map((page) => (
            <li key={page.slug} className="card !p-3 sm:!p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{page.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">/{page.slug}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    className="btn-secondary inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
                    onClick={() => {
                      selectPage(page.slug)
                      onActiveSectionChange(0)
                      onFocusItem(null)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-danger min-h-10 shrink-0 px-2.5 py-2 text-xs sm:px-3 sm:py-1.5"
                    onClick={() => setConfirmDeleteSlug(page.slug)}
                    aria-label={`Remover ${page.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Remover</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmDeleteSlug !== null}
        title="Excluir página?"
        description="Esta ação não pode ser desfeita. Links da bio que apontam para ela deixarão de abrir a página."
        confirmLabel="Remover"
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
