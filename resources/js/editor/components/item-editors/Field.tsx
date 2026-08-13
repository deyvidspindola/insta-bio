import type { ReactNode } from 'react'

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="field min-w-0">
      <label>{label}</label>
      {children}
    </div>
  )
}
