import { useState } from 'react'
import { ErrorText } from '../../shared/ui'
import { useLeads } from '../../app/hooks/useLeads'
import type { LeadItem } from '../../app/application/leadsApi'

const STAGE_LABELS: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  negociando: 'Negociando',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

const DEFAULT_STAGES = ['novo', 'contatado', 'negociando', 'fechado', 'perdido']

function LeadCard({
  lead,
  stages,
  pending,
  onMove,
  onSaveNotes,
  onRemove,
}: {
  lead: LeadItem
  stages: string[]
  pending: boolean
  onMove: (stage: string) => void
  onSaveNotes: (notes: string) => void
  onRemove: () => void
}) {
  const [notesOpen, setNotesOpen] = useState(Boolean(lead.notes?.trim()))
  const [notes, setNotes] = useState(lead.notes ?? '')

  return (
    <article className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <p className="text-sm font-semibold">{lead.name?.trim() || 'Sem nome'}</p>
      {lead.contact?.trim() && (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.contact}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {lead.source_label || lead.source_type}
        </span>
        {lead.created_at && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      <label className="mt-3 block text-[11px] text-muted-foreground">
        Mover para
        <select
          className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
          value={lead.stage}
          disabled={pending}
          onChange={(e) => onMove(e.target.value)}
        >
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage] ?? stage}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="mt-2 text-[11px] font-medium text-primary"
        onClick={() => setNotesOpen((v) => !v)}
      >
        {notesOpen ? 'Ocultar nota' : lead.notes?.trim() ? 'Ver nota' : 'Adicionar nota'}
      </button>

      {notesOpen && (
        <div className="mt-2 space-y-2">
          <textarea
            className="min-h-[4rem] w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
            value={notes}
            disabled={pending}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anotação interna"
          />
          <button
            type="button"
            className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-background disabled:opacity-60"
            disabled={pending}
            onClick={() => onSaveNotes(notes)}
          >
            Salvar nota
          </button>
        </div>
      )}

      <button
        type="button"
        className="mt-2 block text-[11px] text-red-400 hover:underline disabled:opacity-60"
        disabled={pending}
        onClick={onRemove}
      >
        Excluir
      </button>
    </article>
  )
}

/**
 * Funil de prospects — painel Kanban dentro do layout do editor.
 */
export function LeadsPanel() {
  const { items, stages, loading, error, pendingId, moveStage, saveNotes, remove } = useLeads()
  const columns = stages.length > 0 ? stages : DEFAULT_STAGES

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Funil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Leads de formulários e cliques em WhatsApp. Mova o estágio manualmente.
        </p>
      </div>

      <ErrorText>{error}</ErrorText>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {columns.map((stage) => {
            const columnItems = items.filter((item) => item.stage === stage)
            return (
              <section
                key={stage}
                className="min-h-[12rem] rounded-2xl border border-border bg-background/40 p-3"
              >
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{STAGE_LABELS[stage] ?? stage}</h3>
                  <span className="rounded-full bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                    {columnItems.length}
                  </span>
                </header>
                <div className="space-y-2">
                  {columnItems.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">Vazio</p>
                  ) : (
                    columnItems.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        stages={columns}
                        pending={pendingId === lead.id}
                        onMove={(next) => void moveStage(lead.id, next)}
                        onSaveNotes={(notes) => void saveNotes(lead.id, notes)}
                        onRemove={() => {
                          if (window.confirm('Excluir este lead?')) void remove(lead.id)
                        }}
                      />
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
