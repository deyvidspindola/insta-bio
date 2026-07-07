import { Copy, Download, ExternalLink, KeyRound, Pause, Pencil, Play, Trash2 } from 'lucide-react'
import { clientBioHref, clientEditorHref, downloadClientExport, type Client } from '../lib/clients'

type Props = {
  clients: Client[]
  onToggleStatus: (client: Client) => void
  onDelete: (client: Client) => void
  onViewPassword: (client: Client) => void
  onEdit: (client: Client) => void
}

export function ClientTable({ clients, onToggleStatus, onDelete, onViewPassword, onEdit }: Props) {
  if (clients.length === 0) {
    return (
      <div className="card py-12 text-center text-sm text-muted-foreground">
        Nenhum cliente cadastrado ainda.
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 font-medium">
                <a
                  href={clientBioHref(client.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground transition-colors hover:text-primary hover:underline"
                  title="Abrir bio em nova aba"
                >
                  {client.name}
                </a>
              </td>
              <td className="px-4 py-3">
                <code className="text-xs">/{client.slug}/</code>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    client.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}
                >
                  {client.status === 'active' ? 'Ativo' : 'Suspenso'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1"
                    title="Editar cliente"
                    onClick={() => onEdit(client)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1"
                    title="Copiar URL da bio"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        `${window.location.origin}/${client.slug}/`,
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    className="btn-ghost px-2 py-1"
                    href={clientEditorHref(client.slug, client.email)}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir editor"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1"
                    title="Baixar ZIP para hospedagem própria"
                    onClick={() => downloadClientExport(client.id)}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1"
                    title="Ver / redefinir senha"
                    onClick={() => onViewPassword(client)}
                  >
                    <KeyRound className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1"
                    title={client.status === 'active' ? 'Suspender' : 'Reativar'}
                    onClick={() => onToggleStatus(client)}
                  >
                    {client.status === 'active' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1 text-red-400"
                    title="Excluir"
                    onClick={() => onDelete(client)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
