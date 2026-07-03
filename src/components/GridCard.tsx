import type { GridCard as GridCardType } from '../types/bio'
import { resolvePublicUrl } from '../lib/publicUrl'
import { ArrowIcon } from './icons'

export function GridCard({ item }: { item: GridCardType }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-square overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50"
    >
      {item.image ? (
        <>
          <img
            src={resolvePublicUrl(item.image)}
            alt={item.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: item.gradient }} />
      )}

      {item.badge && (
        <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/20">
          {item.badge}
        </span>
      )}

      <ArrowIcon className="absolute right-2 top-2 h-4 w-4 text-white/90 drop-shadow" />

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="text-base font-bold leading-tight text-white">{item.title}</h3>
        {item.subtitle && <p className="mt-0.5 text-[10px] text-white/85">{item.subtitle}</p>}
      </div>
    </a>
  )
}
