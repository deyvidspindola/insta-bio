// Mostra o scrollbar apenas enquanto o usuário rola (ou passa o mouse sobre a
// área rolável). Adiciona a classe `is-scrolling` no elemento que está sendo
// rolado e a remove após um curto intervalo de inatividade.

const HIDE_DELAY = 900

export function initScrollActivity() {
  if (typeof document === 'undefined') return

  const timers = new WeakMap<Element, number>()

  function onScroll(event: Event) {
    const target = event.target
    const el =
      target === document || target === window || target instanceof Document
        ? document.documentElement
        : (target as Element)

    if (!el || !(el instanceof Element)) return

    el.classList.add('is-scrolling')

    const existing = timers.get(el)
    if (existing) window.clearTimeout(existing)

    timers.set(
      el,
      window.setTimeout(() => {
        el.classList.remove('is-scrolling')
        timers.delete(el)
      }, HIDE_DELAY),
    )
  }

  // Captura para pegar o scroll de qualquer container, não só o document.
  document.addEventListener('scroll', onScroll, { capture: true, passive: true })
}
