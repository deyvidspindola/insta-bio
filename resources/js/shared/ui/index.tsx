import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline'
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-background',
  ghost: 'text-muted',
  outline: 'border border-border',
}

/**
 * Botão de ação reutilizável (primário, outline ou ghost).
 */
export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

type FieldProps = {
  name: string
  label: string
  type?: string
  required?: boolean
  defaultValue?: string
}

/**
 * Campo de formulário HTML nativo (login, cadastro, verificação).
 */
export function Field({ name, label, type = 'text', required, defaultValue }: FieldProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
      />
    </label>
  )
}

type AuthCardProps = {
  title: string
  subtitle: string
  children: ReactNode
}

/**
 * Card centralizado das telas de autenticação.
 */
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <a href="/" className="text-sm font-semibold tracking-tight">
          links na bio
        </a>
        <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

type PageShellProps = {
  children: ReactNode
  maxWidth?: string
}

/**
 * Container de página autenticada (onboarding, settings, admin).
 */
export function PageShell({ children, maxWidth = 'max-w-3xl' }: PageShellProps) {
  return <div className={`mx-auto min-h-screen ${maxWidth} px-4 py-10`}>{children}</div>
}

/**
 * Mensagem de erro inline.
 */
export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="text-sm text-red-400">{children}</p>
}

/**
 * Link “Continuar com Google”.
 */
export function GoogleButton() {
  return (
    <a
      className="mt-4 flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm"
      href="/auth/google"
    >
      Continuar com Google
    </a>
  )
}
