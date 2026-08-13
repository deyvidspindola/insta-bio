import { PageShell } from '../../shared/ui'
import { useOnboarding } from '../hooks/useOnboarding'
import { SlugStep } from '../components/SlugStep'
import { LayoutStep } from '../components/LayoutStep'
import { LinksStep } from '../components/LinksStep'

/**
 * Fluxo de 3 passos para criar a primeira bio.
 */
export function OnboardingPage() {
  const onboarding = useOnboarding()

  return (
    <PageShell>
      <a href="/" className="text-sm font-semibold">
        links na bio
      </a>
      <h1 className="mt-6 text-3xl font-semibold">Monte sua bio</h1>
      <p className="mt-2 text-muted">Slug → layout → links. Você pode ajustar tudo depois no editor.</p>

      {onboarding.step === 0 && (
        <SlugStep
          slug={onboarding.slug}
          error={onboarding.slugError}
          onChange={onboarding.setSlug}
          onContinue={async () => {
            if (await onboarding.checkSlug()) onboarding.setStep(1)
          }}
        />
      )}
      {onboarding.step === 1 && (
        <LayoutStep
          template={onboarding.template}
          packId={onboarding.packId}
          packs={onboarding.packs}
          onTemplate={onboarding.setTemplate}
          onPack={onboarding.setPackId}
          onContinue={() => onboarding.setStep(2)}
        />
      )}
      {onboarding.step === 2 && (
        <LinksStep
          name={onboarding.name}
          links={onboarding.links}
          error={onboarding.error}
          pending={onboarding.pending}
          onName={onboarding.setName}
          onLink={onboarding.updateLink}
          onAddLink={onboarding.addLink}
          onSubmit={onboarding.finish}
        />
      )}
    </PageShell>
  )
}
