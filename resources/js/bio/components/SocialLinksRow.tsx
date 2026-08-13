import type { SocialLink, SocialNetwork } from '../types/bio'
import { trackClick } from '../lib/analytics'
import {
  EmailIcon,
  FacebookIcon,
  InstagramIcon,
  SpotifyIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
  LinkedInIcon,
  GitHubIcon,
  XIcon,
  TelegramIcon,
} from './icons'

const LABELS: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  spotify: 'Spotify',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  x: 'X',
  telegram: 'Telegram',
}

function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  switch (network) {
    case 'instagram':
      return <InstagramIcon className={className} />
    case 'tiktok':
      return <TikTokIcon className={className} />
    case 'youtube':
      return <YouTubeIcon className={className} />
    case 'facebook':
      return <FacebookIcon className={className} />
    case 'email':
      return <EmailIcon className={className} />
    case 'whatsapp':
      return <WhatsAppIcon className={className} />
    case 'spotify':
      return <SpotifyIcon className={className} />
    case 'linkedin':
      return <LinkedInIcon className={className} />
    case 'github':
      return <GitHubIcon className={className} />
    case 'x':
      return <XIcon className={className} />
    case 'telegram':
      return <TelegramIcon className={className} />
    default:
      return null
  }
}

function normalizeUrl(link: SocialLink): string {
  if (link.network === 'email' && link.url && !link.url.startsWith('mailto:')) {
    return `mailto:${link.url.replace(/^mailto:/i, '')}`
  }
  return link.url
}

interface SocialLinksRowProps {
  links: SocialLink[]
  className?: string
}

export function SocialLinksRow({ links, className = '' }: SocialLinksRowProps) {
  const visible = links.filter((link) => link.url.trim())
  if (visible.length === 0) return null

  return (
    <div className={`bio-social-links flex flex-wrap items-center justify-center gap-3 ${className}`}>
      {visible.map((link, index) => {
        const href = normalizeUrl(link)
        const label = LABELS[link.network]

        return (
          <a
            key={`${link.network}-${index}`}
            href={href}
            target={link.network === 'email' ? undefined : '_blank'}
            rel={link.network === 'email' ? undefined : 'noopener noreferrer'}
            className="bio-social-links__btn"
            aria-label={label}
            title={label}
            onClick={() => {
              trackClick({
                sectionId: 'social',
                itemIndex: index,
                itemType: link.network,
                label,
                url: href,
              })
            }}
          >
            <SocialIcon network={link.network} className="h-[18px] w-[18px]" />
          </a>
        )
      })}
    </div>
  )
}

export function collectSocialLinks(
  socialLinks: SocialLink[] | undefined,
  instagram?: { handle: string; url: string },
): SocialLink[] {
  if (socialLinks !== undefined) {
    return socialLinks.filter((l) => l.url.trim())
  }

  if (instagram?.url?.trim()) {
    return [{ network: 'instagram', url: instagram.url }]
  }

  return []
}
