import { ErrorText, PageShell } from '../../shared/ui'
import { useFormSubmissions } from '../hooks/useFormSubmissions'
import type { FormSubmissionItem } from '../application/formsApi'

function answerColumns(items: FormSubmissionItem[]): string[] {
  const keys = new Set<string>()
  for (const item of items) {
    Object.keys(item.answers ?? {}).forEach((key) => keys.add(key))
  }
  return Array.from(keys)
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function downloadCsv(items: FormSubmissionItem[]) {
  const columns = answerColumns(items)
  const header = ['Data', 'Formulário', ...columns]
  const lines = [
    header.map(escapeCsv).join(','),
    ...items.map((item) => {
      const cells = [
        item.created_at ?? '',
        item.form_title ?? `${item.section_id}:${item.item_index}`,
        ...columns.map((col) => item.answers?.[col] ?? ''),
      ]
      return cells.map((cell) => escapeCsv(String(cell))).join(',')
    }),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'respostas-formularios.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Lista e exporta respostas dos formulários da bio.
 */
export function FormSubmissionsPage() {
  const { items, forms, filter, changeFilter, loading, error } = useFormSubmissions()
  const columns = answerColumns(items)

  return (
    <PageShell maxWidth="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a href="/app" className="text-sm text-primary">
          ← Voltar ao editor
        </a>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="/app/configuracoes" className="text-muted hover:text-foreground">
            Configurações
          </a>
          <a href="/app/funil" className="text-muted hover:text-foreground">
            Funil
          </a>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Respostas</h1>
          <p className="mt-1 text-sm text-muted">Envios dos formulários da sua bio.</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          disabled={items.length === 0}
          onClick={() => downloadCsv(items)}
        >
          Exportar CSV
        </button>
      </div>

      {forms.length > 0 && (
        <label className="mt-6 block text-sm">
          <span className="mb-1.5 block text-muted">Formulário</span>
          <select
            className="w-full max-w-sm rounded-xl border border-border bg-background px-3 py-2.5"
            value={filter}
            onChange={(e) => changeFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            {forms.map((form) => (
              <option
                key={`${form.section_id}:${form.item_index}`}
                value={`${form.section_id}:${form.item_index}`}
              >
                {form.form_title || `${form.section_id} · #${form.item_index + 1}`}
              </option>
            ))}
          </select>
        </label>
      )}

      <ErrorText>{error}</ErrorText>

      {loading ? (
        <p className="mt-8 text-sm text-muted">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Nenhuma resposta ainda.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-card/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Data</th>
                <th className="px-3 py-2.5 font-semibold">Formulário</th>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2.5 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/70 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString('pt-BR')
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {item.form_title || `${item.section_id}:${item.item_index}`}
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="max-w-xs truncate px-3 py-2.5">
                      {item.answers?.[col] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  )
}
