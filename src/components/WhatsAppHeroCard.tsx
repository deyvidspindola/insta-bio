import type { WhatsAppHero } from '../types/bio'
import { ArrowIcon, WhatsAppIcon } from './icons'

export function WhatsAppHeroCard({ item }: { item: WhatsAppHero }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-3xl border border-[#25D366]/40 transition-all hover:border-[#25D366]/70"
    >
      <div
        className="relative p-5 sm:p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(37,211,102,0.22) 0%, rgba(18,140,126,0.18) 55%, rgba(15,32,28,0.6) 100%)',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
          style={{
            background: 'rgba(37,211,102,0.35)',
            animation: 'bio-glow 4s ease-in-out infinite',
          }}
        />
        <div className="relative z-10 flex items-start gap-4">
          <div className="relative shrink-0">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl"
              style={{
                border: '1px solid rgba(37,211,102,0.6)',
                animation: 'bio-pulse 2.4s ease-out infinite',
              }}
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/25 ring-1 ring-[#25D366]/45">
              <WhatsAppIcon className="h-7 w-7 text-[#25D366]" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7AE3A8]">
              {item.badge}
            </span>
            <h3 className="mt-1 text-xl font-bold leading-tight text-white">{item.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/85 sm:text-sm">
              {item.description}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-[11px] font-semibold text-black shadow-[0_10px_30px_-10px_rgba(37,211,102,0.7)] transition-all group-hover:gap-2.5">
              {item.cta}
              <ArrowIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}
