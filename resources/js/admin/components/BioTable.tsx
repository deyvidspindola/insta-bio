import type { BioRow } from '../application/adminApi'

type Props = {
  bios: BioRow[]
  onPatch: (id: number, body: Record<string, string>) => void
  onImpersonate: (id: number) => void
}

/**
 * Tabela de bios do painel admin.
 */
export function BioTable({ bios, onPatch, onImpersonate }: Props) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-card text-muted">
          <tr>
            <th className="px-3 py-2">Slug</th>
            <th className="px-3 py-2">Dono</th>
            <th className="px-3 py-2">Plano</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {bios.map((bio) => (
            <tr key={bio.id} className="border-t border-border">
              <td className="px-3 py-2">
                <a className="text-primary" href={bio.url} target="_blank" rel="noreferrer">
                  {bio.slug}
                </a>
              </td>
              <td className="px-3 py-2">
                {bio.name}
                <div className="text-muted">{bio.email}</div>
              </td>
              <td className="px-3 py-2">
                <button type="button" onClick={() => void onPatch(bio.id, { plan: bio.plan === 'pro' ? 'free' : 'pro' })}>
                  {bio.plan}
                </button>
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => void onPatch(bio.id, { status: bio.status === 'active' ? 'suspended' : 'active' })}
                >
                  {bio.status}
                </button>
              </td>
              <td className="px-3 py-2">
                <button className="text-primary" type="button" onClick={() => void onImpersonate(bio.id)}>
                  Impersonar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
