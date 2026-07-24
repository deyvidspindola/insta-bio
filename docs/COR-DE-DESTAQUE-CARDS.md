# Cor de destaque — comportamento do card Imprensa

Documento de referência para replicar o campo **Cor de destaque** (`accentColor`) em outros cards da bio.

Referência visual: card tipo `press` (Imprensa) no editor — preview com cor amarela/ouro propagada em borda, label, ícone e CTA.

---

## 1. Ideia

Uma **única cor sólida** (hex/CSS) vira um **tema derivado** (`AppHeroTheme`). Essa cor não pinta só um elemento: gera tokens com opacidades e misturas (`color-mix` em `oklch`) e alimenta vários slots do card.

Fluxo:

```
item.accentColor  →  buildPressTheme()  →  resolveAppHeroTheme()  →  slots do PressCard
     (hex)              (tokens base)         (contraste vs fundo)      (JSX / style)
```

| Arquivo | Papel |
|---------|--------|
| `bio/src/types/bio.ts` → `PressCard.accentColor` | Campo opcional no JSON |
| `editor/.../PressItemFields.tsx` | UI: color picker + input texto |
| `bio/src/lib/pressTheme.ts` → `buildPressTheme` | Cor → tokens do tema |
| `bio/src/lib/appHeroContrast.ts` → `resolveAppHeroTheme` | Ajuste de contraste (fundo claro / CTA claro) |
| `bio/src/components/PressCard.tsx` | Aplica tokens nos elementos |

Padrão se omitido: `#2563eb` (`PRESS_DEFAULT_ACCENT`).

---

## 2. O que a cor pinta (e o que não pinta)

### Recebem a cor de destaque (ou mix dela)

| Slot | Token | Como é derivado da accent | Onde no card |
|------|--------|---------------------------|--------------|
| Borda do card | `border` | `color-mix(in oklch, accent 40%, transparent)` | Contorno do shell |
| Borda no hover | `borderHover` | mix **65%** | Mesmo contorno ao passar o mouse (só se clicável) |
| Fundo / wash | `gradient` | gradiente 135° com mixes 26% → 12% + stop escuro fixo | Fundo do card sem imagem (ou fallback de mídia) |
| Glow | `glow` | mix **35%** | Disponível no tema (presets app; press usa o mesmo contrato) |
| Label / fonte | `badgeText` | **accent pura** | “NOME DA PUBLICAÇÃO” (`source`) em uppercase |
| Fundo do ícone | `iconBg` | mix **22%** | Quadrado do ícone |
| Anel do ícone | `iconRing` | mix **42%** | `box-shadow: inset 0 0 0 1px` |
| Cor do ícone | `iconColor` | **accent pura** | SVG `newspaper` |
| Pulse | `pulseBorder` | mix **55%** | Contrato compartilhado com AppHero |
| CTA fundo | `ctaBg` | **accent pura** (pode ser reforçado no contraste) | Pill “Ler matéria” |
| CTA texto | `ctaText` | `#FFFFFF` base; pode virar `#0A0A0A` se accent for clara | Texto do botão |
| CTA sombra | `ctaShadow` | sombra com mix **55%** da accent | Sombra do pill |

### Não recebem a accent (hierarquia de leitura)

| Elemento | Cor | Motivo |
|----------|-----|--------|
| Título (`title`) | `theme.titleText` (`#FFF` ou `#0A0A0A`) | Contraste com o painel, não com a brand |
| Descrição | `theme.bodyText` (branco/preto com alpha) | Idem |
| Label **com** imagem de fundo | `rgba(255,255,255,0.85)` | Prioriza legibilidade sobre a foto |
| Título/descrição **com** imagem | branco / branco 85% | Idem |

Regra mental: **a accent marca identidade e ação**; **título e corpo priorizam contraste**.

---

## 3. Fórmulas canônicas (`buildPressTheme`)

Fonte: `bio/src/lib/pressTheme.ts`.

```ts
accent = accentColor?.trim() || '#2563eb'

border:      color-mix(in oklch, ${accent} 40%, transparent)
borderHover: color-mix(in oklch, ${accent} 65%, transparent)
gradient:    linear-gradient(135deg,
               color-mix(in oklch, ${accent} 26%, transparent) 0%,
               color-mix(in oklch, ${accent} 12%, transparent) 55%,
               rgba(15,20,30,0.68) 100%)
glow:        color-mix(in oklch, ${accent} 35%, transparent)
badgeText:   ${accent}
iconBg:      color-mix(in oklch, ${accent} 22%, transparent)
iconRing:    color-mix(in oklch, ${accent} 42%, transparent)
iconColor:   ${accent}
pulseBorder: color-mix(in oklch, ${accent} 55%, transparent)
ctaBg:       ${accent}
ctaText:     '#FFFFFF'
ctaShadow:   0 10px 30px -10px color-mix(in oklch, ${accent} 55%, transparent)
```

Por isso amarelo forte “parece sólido” na borda e no CTA, mas o wash do fundo e o box do ícone ficam mais suaves — opacidades diferentes do mesmo matiz.

---

## 4. Contraste (`resolveAppHeroTheme`)

Depois dos tokens base, `resolveAppHeroTheme(theme, pageBackground)`:

1. Estima luminância do painel (gradient composto sobre o fundo da bio).
2. Se o painel/fundo for claro → escurece o gradient com scrim preto; título/corpo viram escuros.
3. Em fundo de página claro → escurece levemente `border` / `borderHover` / `glow` / `pulseBorder`.
4. Se o CTA tiver pouco contraste com o painel (ex.: amarelo claro) → reforça o fundo do botão e **inverte** `ctaText` para preto — exatamente o caso do print com CTA amarelo e texto escuro.

**Não reimplementar** essa lógica por card: reutilizar `resolveAppHeroTheme`.

---

## 5. Mapa JSX (PressCard)

| Token | Uso no componente |
|-------|-------------------|
| `border` / `borderHover` | `style.borderColor` no `PressShell` (+ mouse enter/leave) |
| `gradient` | fundo absoluto (sem imagem) ou `CardCoverImage` fallback; layouts compact/condensed |
| `badgeText` | `color` do `source` (exceto layout default **com** imagem) |
| `iconBg` + `iconRing` + `iconColor` | `PressIconBox` |
| `ctaBg` + `ctaText` + `ctaShadow` | pill do CTA (default + compact; condensed só seta) |
| `titleText` / `bodyText` | título e descrição |

Layouts: `default` | `compact` | `condensed` — **mesmo tema**; muda densidade, não a regra de cor.

---

## 6. Como replicar em outro card

Checklist mínimo:

1. **Schema** — `accentColor?: string` no tipo do item (ou reutilizar campo equivalente).
2. **Editor** — campo “Cor de destaque” (picker + texto), default documentado.
3. **Builder** — `buildXTheme(accent)` retornando `AppHeroTheme` com as **mesmas proporções de mix** da seção 3 (ou extrair `buildAccentTheme(accent)` compartilhado).
4. **Resolve** — sempre `resolveAppHeroTheme(build…(accent), pageBackground)`.
5. **Slots** — ligar tokens aos mesmos papéis:
   - contorno → `border` / `borderHover`
   - label secundária → `badgeText`
   - ícone → `iconBg` + `iconRing` + `iconColor`
   - CTA → `ctaBg` + `ctaText` + `ctaShadow`
   - wash → `gradient`
6. **Não** pintar título/descrição com a accent (usar `titleText` / `bodyText`, ou branco sobre foto).

### Cards candidatos

| Card | Situação hoje | Nota |
|------|---------------|------|
| `press` | ✅ Referência | `accentColor` livre |
| `whatsapp-hero` / app heroes | Preset fixo | Poderia aceitar override opcional via mesmo builder |
| `feature` / `grid` / `products` / `slide` | Gradiente/imagem própria | Candidatos a `accentColor` se quiserem borda + CTA + badge no mesmo padrão |
| `link` / `location` | Tema global da bio | Fora do escopo “destaque por card”, a menos que se queira exceção |

### Extração recomendada (quando for implementar)

```ts
// Ex.: bio/src/lib/accentTheme.ts
export function buildAccentTheme(accentColor?: string, fallback = '#2563eb'): AppHeroTheme
```

`buildPressTheme` passa a ser um alias fino; Feature/Grid/etc. reutilizam a mesma função.

---

## 7. Critério de aceite (QA visual)

Com accent `#E8B923` (ou similar) em fundo escuro, **sem** imagem:

- [ ] Borda do card tingida (não cinza neutro)
- [ ] Label uppercase na accent
- [ ] Box do ícone com wash + ícone na accent
- [ ] CTA preenchido na accent; texto branco **ou** preto se a accent for clara
- [ ] Título branco (ou escuro se painel claro); **não** amarelo
- [ ] Hover reforça a borda (`borderHover`)

Com imagem de fundo: CTA e borda ainda na accent; label/título priorizam branco sobre a foto.

---

## 8. Resumo em uma frase

**A cor de destaque é a identidade do card: contorno, rótulo, ícone e botão; título e texto permanecem neutros por contraste.**
