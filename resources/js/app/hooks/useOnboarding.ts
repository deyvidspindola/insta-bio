import { FormEvent, useMemo, useState } from 'react'
import { THEME_PACKS } from '@site/lib/themePacks'
import { buildOnboardingConfig, type OnboardingLink } from '../application/buildOnboardingConfig'
import { onboardingApi } from '../application/onboardingApi'

const INITIAL_LINKS: OnboardingLink[] = [
  { title: 'WhatsApp', url: 'https://wa.me/55' },
  { title: 'Instagram', url: 'https://instagram.com/' },
]

/**
 * Estado e ações dos 3 passos do onboarding.
 */
export function useOnboarding() {
  const [step, setStep] = useState(0)
  const [slug, setSlug] = useState('')
  const [slugError, setSlugError] = useState<string | null>(null)
  const [packId, setPackId] = useState(THEME_PACKS[0]?.id ?? 'dark-agency')
  const [template, setTemplate] = useState('classic')
  const [name, setName] = useState('')
  const [links, setLinks] = useState(INITIAL_LINKS)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const packs = useMemo(() => THEME_PACKS.slice(0, 8), [])

  async function checkSlug() {
    const data = await onboardingApi.checkSlug(slug)
    setSlugError(data.ok ? null : data.error ?? 'Slug inválido')
    if (data.slug) setSlug(data.slug)
    return data.ok
  }

  async function finish(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const result = await onboardingApi.complete(
        slug,
        packId,
        buildOnboardingConfig(name, template, packId, links),
      )
      window.location.href = result.redirect || '/app'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a bio')
      setPending(false)
    }
  }

  function updateLink(index: number, field: keyof OnboardingLink, value: string) {
    setLinks((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  function addLink() {
    setLinks((current) => [...current, { title: '', url: '' }])
  }

  return {
    step,
    setStep,
    slug,
    setSlug,
    slugError,
    packId,
    setPackId,
    template,
    setTemplate,
    name,
    setName,
    links,
    error,
    pending,
    packs,
    checkSlug,
    finish,
    updateLink,
    addLink,
  }
}
