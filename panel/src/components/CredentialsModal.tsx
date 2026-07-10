import { Copy, X } from 'lucide-react'
import { clientBioUrl, clientEditorUrl, type CreatedClient } from '../lib/clients'

type Props = {
  client: CreatedClient | null
  onClose: () => void
}

export function CredentialsModal({ client, onClose }: Props) {
  if (!client) return null

  const bioUrl = clientBioUrl(client)
  const editorUrl = clientEditorUrl(client)

  const lines = [
    `Bio: ${bioUrl}`,
    `Editor: ${editorUrl}`,
    `E-mail: ${client.email}`,
    `Senha: ${client.password}`,
  ]

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="modal-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Cliente criado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Envie as credenciais ao cliente. Você pode consultar a senha depois pelo botão de
              senha na lista.
            </p>
          </div>
          <button type="button" className="btn-ghost px-2 py-1" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <p>
            <span className="text-muted-foreground">Nome:</span> {client.name}
          </p>
          <p>
            <span className="text-muted-foreground">Bio:</span>{' '}
            <a className="text-primary underline" href={bioUrl} target="_blank" rel="noreferrer">
              {bioUrl}
            </a>
          </p>
          <p>
            <span className="text-muted-foreground">Editor:</span>{' '}
            <a className="text-primary underline" href={editorUrl} target="_blank" rel="noreferrer">
              {editorUrl}
            </a>
          </p>
          <p>
            <span className="text-muted-foreground">E-mail:</span> {client.email}
          </p>
          <p>
            <span className="text-muted-foreground">Senha:</span>{' '}
            <code className="rounded bg-background px-1.5 py-0.5">{client.password}</code>
          </p>
        </div>

        {client.instagram_warning && (
          <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            Instagram não importado: {client.instagram_warning}. O cliente foi criado normalmente — ajuste
            nome e foto manualmente no editor.
          </p>
        )}

        <button
          type="button"
          className="btn-secondary mt-4 inline-flex items-center gap-2"
          onClick={() => void navigator.clipboard.writeText(lines.join('\n'))}
        >
          <Copy className="h-4 w-4" />
          Copiar credenciais
        </button>
      </div>
    </div>
  )
}
