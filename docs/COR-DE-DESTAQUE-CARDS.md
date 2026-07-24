# Cor de destaque — cards no estilo dos links

Campo **Cor do card** (`accentColor`) alinhado aos templates **Sólido** e **Pill** da aba Estilo dos links.

## Comportamento

| Transparência | Resultado |
|---------------|-----------|
| **100%** | Preenchimento sólido (gradiente leve da mesma cor, como links Sólido) |
| **&lt; 100%** | Mesma cor com `color-mix` → mais transparente |

Chrome (badge, ícone, CTA): branco sobre o preenchimento — igual aos links preenchidos.

Fluxo:

```
accentColor → buildAccentTheme() → resolveAccentCardTheme() → slots do card
```

`resolveAccentCardTheme` **não** aplica scrim preto (o do AppHero apagava o sólido).

## Arquivos

| Arquivo | Papel |
|---------|--------|
| `bio/src/lib/accentTheme.ts` | `buildAccentTheme` + `resolveAccentCardTheme` |
| `editor/.../AccentColorField.tsx` | ColorInput + slider de transparência |
| `FeatureCard` / `PressCard` / `GridCard` | Consomem o tema |

## Slots

| Slot | Em sólido (100%) |
|------|------------------|
| Fundo | `solidFrom` → `solidTo` (mesma lógica dos links) |
| Borda | transparente |
| Badge / ícone | branco + vidro branco 18% |
| CTA | fundo branco, texto escuro |
| Título / corpo | branco (ou escuro se a cor for muito clara) |

Legado: `gradient` antigo sem `accentColor` → primeiro token de cor via `resolveAccentColor()`.
