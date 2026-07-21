import type { CardSchedule, SectionItem } from '../types/bio'

export const CARD_SCHEDULE_TIMEZONE = 'America/Sao_Paulo'

type ScheduleLike = { schedule?: CardSchedule }

/**
 * Converte ISO (com ou sem offset) para Date.
 * Sem offset: interpreta como horário local de America/Sao_Paulo.
 */
export function parseScheduleInstant(iso: string): Date | null {
  const raw = iso.trim()
  if (!raw) return null

  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(raw)) {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  )
  if (!match) {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4] ?? '0')
  const minute = Number(match[5] ?? '0')
  const second = Number(match[6] ?? '0')

  // Encontra o offset SP no instante aproximado (UTC) e ajusta.
  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  const offsetMinutes = timeZoneOffsetMinutes(CARD_SCHEDULE_TIMEZONE, probe)
  const utcMs = Date.UTC(year, month - 1, day, hour, minute, second) - offsetMinutes * 60_000
  const result = new Date(utcMs)
  return Number.isNaN(result.getTime()) ? null : result
}

function timeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    hourCycle: 'h23',
  })
  const part = dtf.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
  const m = part.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i)
  if (!m) return -180 // fallback BR padrão
  const sign = m[1] === '-' ? -1 : 1
  const hours = Number(m[2])
  const mins = Number(m[3] ?? '0')
  return sign * (hours * 60 + mins)
}

/** Offset atual de SP no formato ±HH:MM para serializar datetime-local. */
export function saoPauloOffsetLabel(at: Date = new Date()): string {
  const minutes = timeZoneOffsetMinutes(CARD_SCHEDULE_TIMEZONE, at)
  const sign = minutes >= 0 ? '+' : '-'
  const abs = Math.abs(minutes)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${sign}${hh}:${mm}`
}

/** `datetime-local` (YYYY-MM-DDTHH:mm) → ISO com offset de SP. */
export function localInputToScheduleIso(localValue: string): string | undefined {
  const value = localValue.trim()
  if (!value) return undefined
  const withSeconds = value.length === 16 ? `${value}:00` : value
  const offset = saoPauloOffsetLabel(parseScheduleInstant(withSeconds) ?? new Date())
  return `${withSeconds}${offset}`
}

/** ISO → valor para `datetime-local` no fuso SP. */
export function scheduleIsoToLocalInput(iso: string | undefined): string {
  if (!iso?.trim()) return ''
  const date = parseScheduleInstant(iso)
  if (!date) return ''

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CARD_SCHEDULE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

export function hasActiveSchedule(item: ScheduleLike): boolean {
  return item.schedule !== undefined
}

/**
 * Visibilidade na bio pública.
 * - sem schedule → sempre
 * - só from → agora >= from
 * - só until → agora < until
 * - ambos → from <= agora < until
 */
export function isItemVisibleNow(item: ScheduleLike, now: Date = new Date()): boolean {
  const schedule = item.schedule
  if (!schedule) return true

  const fromRaw = schedule.from?.trim()
  const untilRaw = schedule.until?.trim()
  if (!fromRaw && !untilRaw) return true

  const from = fromRaw ? parseScheduleInstant(fromRaw) : null
  const until = untilRaw ? parseScheduleInstant(untilRaw) : null
  const t = now.getTime()

  if (from && t < from.getTime()) return false
  if (until && t >= until.getTime()) return false
  return true
}

export function filterVisibleItems<T extends ScheduleLike>(
  items: T[],
  now: Date = new Date(),
): T[] {
  return items.filter((item) => isItemVisibleNow(item, now))
}

export function itemHasScheduleWindow(item: SectionItem): boolean {
  const s = item.schedule
  if (!s) return false
  return Boolean(s.from?.trim() || s.until?.trim())
}
