import type { ReactNode } from 'react'

export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="field-group space-y-3 rounded-lg border border-border/70 bg-muted/15 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}
