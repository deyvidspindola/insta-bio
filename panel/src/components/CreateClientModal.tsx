import { useState } from 'react'
import { AtSign, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { validateSlug, normalizeSlug } from '@shared/lib/reservedSlugs'
import { createClient, slugFromName, type CreatedClient } from '../lib/clients'
import { lookupInstagram, type InstagramProfile } from '../lib/instagram'
import { generatePassword } from '../lib/password'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (client: CreatedClient) => void
}

function resetFormState() {
  return {
    instagramHandle: '',
    instagramProfile: null as InstagramProfile | null,
    name: '',
    slug: '',
    email: '',
    selfHosted: false,
    allowedHost: '',
    deployPath: '/',
    password: generatePassword(),
    slugTouched: false,
    showPassword: true,
    error: null as string | null,
    lookupError: null as string | null,
  }
}

export function CreateClientModal({ open, onClose, onCreated }: Props) {
  const [instagramHandle, setInstagramHandle] = useState('')
  const [instagramProfile, setInstagramProfile] = useState<InstagramProfile | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [selfHosted, setSelfHosted] = useState(false)
  const [allowedHost, setAllowedHost] = useState('')
  const [deployPath, setDeployPath] = useState('/')
  const [password, setPassword] = useState(() => generatePassword())
  const [showPassword, setShowPassword] = useState(true)
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)

  if (!open) return null

  const slugPreview = normalizeSlug(slug || slugFromName(name))
  const slugError = slugPreview ? validateSlug(slugPreview) : null
  const passwordError = password.trim().length < 6 ? 'Mínimo de 6 caracteres' : null

  function handleClose() {
    const fresh = resetFormState()
    setInstagramHandle(fresh.instagramHandle)
    setInstagramProfile(fresh.instagramProfile)
    setName(fresh.name)
    setSlug(fresh.slug)
    setEmail(fresh.email)
    setSelfHosted(fresh.selfHosted)
    setAllowedHost(fresh.allowedHost)
    setDeployPath(fresh.deployPath)
    setPassword(fresh.password)
    setShowPassword(fresh.showPassword)
    setSlugTouched(fresh.slugTouched)
    setError(fresh.error)
    setLookupError(fresh.lookupError)
    onClose()
  }

  async function handleInstagramLookup() {
    setLookupError(null)
    setLookingUp(true)
    try {
      const profile = await lookupInstagram(instagramHandle)
      setInstagramProfile(profile)
      setInstagramHandle(`@${profile.username}`)
      setName(profile.fullName)
      if (!slugTouched) setSlug(profile.username)
    } catch (err) {
      setInstagramProfile(null)
      setLookupError(err instanceof Error ? err.message : 'Erro ao buscar perfil')
    } finally {
      setLookingUp(false)
    }
  }

  const hostingError = selfHosted
    ? !allowedHost.trim()
      ? 'Informe o domínio autorizado'
      : !deployPath.trim()
        ? 'Informe a pasta no domínio'
        : null
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const client = await createClient({
        name,
        slug: slug || name,
        email,
        password,
        selfHosted,
        allowedHost: selfHosted ? allowedHost : undefined,
        deployPath: selfHosted ? deployPath : undefined,
        instagramHandle: instagramProfile?.username ?? instagramHandle,
      })
      onCreated(client)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Fechar" onClick={handleClose} />
      <div className="modal-panel">
        <h2 className="text-lg font-semibold">Novo cliente</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Importe dados do Instagram ou preencha manualmente. Será criada a pasta{' '}
          <code className="text-xs">/{slugPreview || 'slug'}/</code>.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="field mb-0">
            <label htmlFor="client-instagram">Instagram</label>
            <div className="flex gap-2">
              <input
                id="client-instagram"
                value={instagramHandle}
                onChange={(e) => {
                  setInstagramHandle(e.target.value)
                  setInstagramProfile(null)
                  setLookupError(null)
                }}
                placeholder="@deyvidspindola"
              />
              <button
                type="button"
                className="btn-secondary shrink-0 whitespace-nowrap px-3"
                onClick={() => void handleInstagramLookup()}
                disabled={lookingUp || !instagramHandle.trim()}
              >
                <AtSign className="mr-1.5 inline h-4 w-4" />
                {lookingUp ? 'Buscando…' : 'Buscar'}
              </button>
            </div>
            {lookupError && <p className="mt-1 text-xs text-red-400">{lookupError}</p>}
          </div>

          {instagramProfile && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <img
                src={instagramProfile.profilePicUrl}
                alt={instagramProfile.fullName}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/30"
              />
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium">{instagramProfile.fullName}</p>
                <p className="truncate text-muted-foreground">@{instagramProfile.username}</p>
                {instagramProfile.biography && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {instagramProfile.biography}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="field mb-0">
            <label htmlFor="client-name">Nome</label>
            <input
              id="client-name"
              value={name}
              onChange={(e) => {
                const value = e.target.value
                setName(value)
                if (!slugTouched) setSlug(slugFromName(value))
              }}
              placeholder="Igreja Expressar"
              required
            />
          </div>

          <div className="field mb-0">
            <label htmlFor="client-slug">Slug (URL)</label>
            <input
              id="client-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              placeholder="igreja-expressar"
              required
            />
            {slugError && <p className="mt-1 text-xs text-red-400">{slugError}</p>}
          </div>

          <div className="field mb-0">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={selfHosted}
                onChange={(e) => setSelfHosted(e.target.checked)}
              />
              <span>
                <span className="font-medium">Hospedagem própria</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  Marque se a bio vai rodar fora do nosso domínio (ZIP em servidor do cliente).
                </span>
              </span>
            </label>
          </div>

          {selfHosted && (
            <>
              <div className="field mb-0">
                <label htmlFor="client-allowed-host">Domínio autorizado</label>
                <input
                  id="client-allowed-host"
                  value={allowedHost}
                  onChange={(e) => setAllowedHost(e.target.value)}
                  placeholder="cliente.com.br"
                  required={selfHosted}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Sem www — deve ser exatamente o domínio onde o ZIP será instalado.
                </p>
              </div>

              <div className="field mb-0">
                <label htmlFor="client-deploy-path">Pasta no domínio</label>
                <input
                  id="client-deploy-path"
                  value={deployPath}
                  onChange={(e) => setDeployPath(e.target.value)}
                  placeholder="/ ou links"
                  required={selfHosted}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use <code className="text-xs">/</code> para a raiz do domínio ou o nome da subpasta
                  (ex.: <code className="text-xs">links</code>). Pode ser diferente do slug no painel.
                </p>
              </div>
            </>
          )}

          <div className="field mb-0">
            <label htmlFor="client-email">E-mail do cliente (login do editor)</label>
            <input
              id="client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              required
            />
          </div>

          <div className="field mb-0">
            <label htmlFor="client-password">Senha do editor</label>
            <div className="flex gap-2">
              <input
                id="client-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha gerada"
                className="font-mono"
                required
              />
              <button
                type="button"
                className="btn-ghost shrink-0 px-2.5"
                onClick={() => setShowPassword((v) => !v)}
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="btn-secondary shrink-0 px-2.5"
                onClick={() => {
                  setPassword(generatePassword())
                  setShowPassword(true)
                }}
                title="Gerar nova senha"
                aria-label="Gerar nova senha"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {passwordError && <p className="mt-1 text-xs text-red-400">{passwordError}</p>}
          </div>

          {instagramProfile && (
            <p className="text-xs text-muted-foreground">
              Ao criar, a foto do perfil será salva na bio e o @ será configurado automaticamente.
            </p>
          )}

          {hostingError && <p className="text-sm text-red-400">{hostingError}</p>}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || Boolean(slugError) || Boolean(passwordError) || Boolean(hostingError)}
            >
              {loading ? 'Criando…' : 'Criar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
