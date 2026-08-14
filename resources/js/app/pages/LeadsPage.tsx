import { useState } from 'react'
import { ErrorText, PageShell } from '../../shared/ui'
import { useLeads } from '../hooks/useLeads'
import type { LeadItem } from '../application/leadsApi'

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
        <p className="mt-0.5 truncate text-xs text-muted">{lead.contact}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted">
          {lead.source_label || lead.source_type}
        </span>
        {lead.created_at && (
          <span className="text-[10px] text-muted">
            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      <label className="mt-3 block text-[11px] text-muted">
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
 * Kanban simples do funil de prospects (mover via select).
 */
export function LeadsPage() {
  const { items, stages, loading, error, pendingId, moveStage, saveNotes, remove } = useLeads()
  const columns = stages.length > 0 ? stages : DEFAULT_STAGES

  return (
    <PageShell maxWidth="max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a href="/app" className="text-sm text-primary">
          ← Voltar ao editor
        </a>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="/app/respostas" className="text-muted hover:text-foreground">
            Respostas
          </a>
          <a href="/app/configuracoes" className="text-muted hover:text-foreground">
            Configurações
          </a>
        </div>
      </div>

      <h1 className="mt-6 text-3xl font-semibold">Funil</h1>
      <p className="mt-1 text-sm text-muted">
        Leads de formulários e cliques em WhatsApp. Mova o estágio manualmente.
      </p>

      <ErrorText>{error}</ErrorText>

      {loading ? (
        <p className="mt-8 text-sm text-muted">Carregando…</p>
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {columns.map((stage) => {
            const columnItems = items.filter((item) => item.stage === stage)
            return (
              <section
                key={stage}
                className="min-h-[12rem] rounded-2xl border border-border bg-background/40 p-3"
              >
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">{STAGE_LABELS[stage] ?? stage}</h2>
                  <span className="rounded-full bg-card px-2 py-0.5 text-[11px] text-muted">
                    {columnItems.length}
                  </span>
                </header>
                <div className="space-y-2">
                  {columnItems.length === 0 ? (
                    <p className="text-[11px] text-muted">Vazio</p>
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
    </PageShell>
  )
}
