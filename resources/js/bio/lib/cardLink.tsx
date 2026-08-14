import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import type { CardAction } from '../types/bio'
import { FormModal, fetchPublishedForm, type ResolvedFormDefinition } from '../components/FormModal'
import { trackClick, trackMetaFromElement } from './analytics'
import { openTallyPopup, parseTallyFormId } from './tally'

export function hasClickableUrl(url?: string): boolean {
  const value = url?.trim() ?? ''
  if (!value || value === '#' || value === 'https://' || value === 'http://') return false

  try {
    const href = value.includes('://') ? value : `https://${value}`
    const parsed = new URL(href)
    return parsed.hostname.length > 0
  } catch {
    return false
  }
}

export function resolveCardHref(url: string): string {
  const value = url.trim()
  return value.includes('://') ? value : `https://${value}`
}

/** Texto copiado: CTA (ex.: chave Pix) ou URL. */
export function resolveCopyText(cta?: string, url?: string): string {
  return (cta?.trim() || url?.trim() || '')
}

/** Href relativo da página interna no domínio atual. */
export function resolvePageHref(pageSlug: string): string {
  const bioSlug = window.location.pathname.split('/').filter(Boolean)[0] ?? ''
  return `/${bioSlug}/${pageSlug.trim()}`
}

export function resolveCardAction(action?: CardAction): CardAction {
  return action ?? 'link'
}

/** Card responde a clique (link, copy, tally, page ou form). */
export function isCardInteractive(
  action: CardAction | undefined,
  url?: string,
  cta?: string,
  pageSlug?: string,
  formSlug?: string,
): boolean {
  const mode = resolveCardAction(action)
  if (mode === 'copy') return Boolean(resolveCopyText(cta, url))
  if (mode === 'tally') {
    return Boolean(parseTallyFormId(url ?? '')) || hasClickableUrl(url)
  }
  if (mode === 'page') return Boolean(pageSlug?.trim())
  if (mode === 'form') return Boolean(formSlug?.trim())
  return hasClickableUrl(url)
}

type CardActionContextValue = {
  action: CardAction
  copied: boolean
  interactive: boolean
}

const CardActionContext = createContext<CardActionContextValue>({
  action: 'link',
  copied: false,
  interactive: false,
})

export function useCardAction(): CardActionContextValue {
  return useContext(CardActionContext)
}

type CardLinkProps = {
  url?: string
  action?: CardAction
  pageSlug?: string
  formSlug?: string
  /** Override do texto a copiar (padrão: url). Preferir CTA via resolveCopyText no caller. */
  copyText?: string
  className?: string
  children: ReactNode
  onMouseEnter?: React.MouseEventHandler<HTMLElement>
  onMouseLeave?: React.MouseEventHandler<HTMLElement>
  style?: React.CSSProperties
}

export function CardLink({
  url,
  action,
  pageSlug,
  formSlug,
  copyText,
  className = '',
  children,
  onMouseEnter,
  onMouseLeave,
  style,
}: CardLinkProps) {
  const mode = resolveCardAction(action)
  const [copied, setCopied] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formDef, setFormDef] = useState<ResolvedFormDefinition | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const interactive = isCardInteractive(mode, url, copyText, pageSlug, formSlug)

  const contextValue: CardActionContextValue = {
    action: mode,
    copied,
    interactive,
  }

  const shellProps = {
    className,
    onMouseEnter,
    onMouseLeave,
    style,
  }

  if (mode === 'copy') {
    const text = resolveCopyText(copyText, url)
    if (!text) {
      return (
        <CardActionContext.Provider value={contextValue}>
          <div {...shellProps} className={`${className} cursor-default`} aria-disabled="true">
            {children}
          </div>
        </CardActionContext.Provider>
      )
    }

    return (
      <CardActionContext.Provider value={contextValue}>
        <button
          type="button"
          {...shellProps}
          className={`${className} relative cursor-pointer text-left`}
          aria-live="polite"
          onClick={(event) => {
            const fromDom = trackMetaFromElement(event.currentTarget)
            void (async () => {
              try {
                await navigator.clipboard.writeText(text)
              } catch {
                const ta = document.createElement('textarea')
                ta.value = text
                ta.setAttribute('readonly', '')
                ta.style.position = 'fixed'
                ta.style.left = '-9999px'
                document.body.appendChild(ta)
                ta.select()
                document.execCommand('copy')
                document.body.removeChild(ta)
              }
              trackClick({
                ...fromDom,
                url: `copy://${encodeURIComponent(text.slice(0, 120))}`,
              })
              setCopied(true)
              window.setTimeout(() => setCopied(false), 2000)
            })()
          }}
        >
          {children}
          {copied && (
            <span
              className="bio-copy-toast pointer-events-none absolute inset-x-3 bottom-3 z-50 flex justify-center sm:inset-x-4 sm:bottom-4"
              role="status"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-black shadow-lg ring-1 ring-black/10">
                Copiado!
              </span>
            </span>
          )}
        </button>
      </CardActionContext.Provider>
    )
  }

  if (mode === 'tally') {
    const formId = parseTallyFormId(url ?? '')
    if (formId) {
      return (
        <CardActionContext.Provider value={contextValue}>
          <button
            type="button"
            {...shellProps}
            className={`${className} cursor-pointer text-left`}
            onClick={(event) => {
              const fromDom = trackMetaFromElement(event.currentTarget)
              trackClick({
                ...fromDom,
                url: url?.trim() || `tally://${formId}`,
              })
              void openTallyPopup(formId).catch(() => {
                window.open(resolveCardHref(url!), '_blank', 'noopener,noreferrer')
              })
            }}
          >
            {children}
          </button>
        </CardActionContext.Provider>
      )
    }
  }

  if (mode === 'page') {
    const slug = pageSlug?.trim()
    if (slug) {
      const href = resolvePageHref(slug)

      return (
        <CardActionContext.Provider value={{ ...contextValue, interactive: true }}>
          <a
            href={href}
            {...shellProps}
            className={`${className} cursor-pointer`}
            onClick={(event) => {
              const fromDom = trackMetaFromElement(event.currentTarget)
              trackClick({
                ...fromDom,
                url: href,
              })
            }}
          >
            {children}
          </a>
        </CardActionContext.Provider>
      )
    }
  }

  if (mode === 'form') {
    const slug = formSlug?.trim()
    if (slug) {
      return (
        <CardActionContext.Provider value={{ ...contextValue, interactive: true }}>
          <button
            type="button"
            {...shellProps}
            className={`${className} cursor-pointer`}
            disabled={formLoading}
            onClick={(event) => {
              const fromDom = trackMetaFromElement(event.currentTarget)
              trackClick({
                ...fromDom,
                url: `form://${slug}`,
              })
              setFormLoading(true)
              void fetchPublishedForm(slug)
                .then((data) => {
                  if (data) {
                    setFormDef(data)
                    setFormOpen(true)
                  }
                })
                .finally(() => setFormLoading(false))
            }}
          >
            {children}
          </button>
          <FormModal open={formOpen} definition={formDef} onClose={() => setFormOpen(false)} />
        </CardActionContext.Provider>
      )
    }
  }

  if (hasClickableUrl(url)) {
    const href = resolveCardHref(url!)

    return (
      <CardActionContext.Provider value={{ ...contextValue, action: 'link', interactive: true }}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          {...shellProps}
          onClick={(event) => {
            const fromDom = trackMetaFromElement(event.currentTarget)
            trackClick({
              ...fromDom,
              url: href,
            })
          }}
        >
          {children}
        </a>
      </CardActionContext.Provider>
    )
  }

  return (
    <CardActionContext.Provider value={contextValue}>
      <div {...shellProps} className={`${className} cursor-default`} aria-disabled="true">
        {children}
      </div>
    </CardActionContext.Provider>
  )
}
