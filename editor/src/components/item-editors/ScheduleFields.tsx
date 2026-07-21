import { CalendarClock } from 'lucide-react'
import type { SectionItem } from '@bio-types'
import {
  localInputToScheduleIso,
  scheduleIsoToLocalInput,
} from '@site/lib/cardSchedule'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

export function ScheduleFields({
  item,
  onChange,
}: {
  item: SectionItem
  onChange: (item: SectionItem) => void
}) {
  const enabled = item.schedule !== undefined
  const fromLocal = scheduleIsoToLocalInput(item.schedule?.from)
  const untilLocal = scheduleIsoToLocalInput(item.schedule?.until)
  const rangeInvalid = Boolean(fromLocal && untilLocal) && untilLocal <= fromLocal

  function patchSchedule(next: { from?: string; until?: string } | undefined) {
    if (next === undefined) {
      const { schedule: _s, ...rest } = item as SectionItem & { schedule?: unknown }
      onChange(rest as SectionItem)
      return
    }
    const schedule: { from?: string; until?: string } = {}
    if (next.from) schedule.from = next.from
    if (next.until) schedule.until = next.until
    onChange({ ...item, schedule })
  }

  return (
    <FieldGroup title="Agendamento">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">Agendar exibição</span>
            <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
              Defina quando este card deve aparecer ou sair do ar.
            </span>
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Agendar exibição deste card"
          onClick={() => patchSchedule(enabled ? undefined : {})}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            enabled ? 'border-primary bg-primary/25' : 'border-border bg-muted'
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full shadow-sm transition-transform ${
              enabled ? 'translate-x-5 bg-primary' : 'translate-x-0 bg-muted-foreground'
            }`}
          />
        </button>
      </div>
      {enabled && (
        <div className="space-y-3">
          <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),1fr))] gap-3">
            <Field label="Aparecer a partir de">
              <input
                type="datetime-local"
                className="min-w-0"
                value={fromLocal}
                onChange={(e) =>
                  patchSchedule({
                    from: localInputToScheduleIso(e.target.value),
                    until: item.schedule?.until,
                  })
                }
              />
            </Field>
            <Field label="Remover em">
              <input
                type="datetime-local"
                className="min-w-0"
                value={untilLocal}
                onChange={(e) =>
                  patchSchedule({
                    from: item.schedule?.from,
                    until: localInputToScheduleIso(e.target.value),
                  })
                }
              />
            </Field>
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Fuso: America/Sao_Paulo. Se só o início estiver preenchido, o card aparece naquela data e
            permanece até ser removido ou ter data de fim.
          </p>
          {rangeInvalid && (
            <p className="text-[10px] text-red-400">
              A data de remoção deve ser posterior à de início.
            </p>
          )}
          {!fromLocal && !untilLocal && (
            <p className="text-[10px] text-amber-500/90">
              Agendamento ativo sem datas — o card continua visível até preencher início e/ou fim.
            </p>
          )}
        </div>
      )}
    </FieldGroup>
  )
}
