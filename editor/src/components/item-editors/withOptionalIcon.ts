import type { IconName } from '@bio-types'

/** Define ou remove o ícone sem deixar `icon: undefined` no objeto. */
export function withOptionalIcon<T extends { icon?: IconName }>(item: T, icon?: IconName): T {
  if (icon) return { ...item, icon }
  if (!('icon' in item)) return item
  const { icon: _removed, ...rest } = item
  return rest as T
}
