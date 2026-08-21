# Qualidade de Código — TypeScript e build (2026-08-14)

Parte 01 de 05 · [Voltar ao resumo](00-resumo.md)

## Achado #1 — `strict: true` está configurado mas nunca é verificado (nem no CI, nem no build)
- **Severidade:** Alto
- **Categoria:** Boas práticas / Organização
- **Local:** `tsconfig.json:1-24`, `vite.config.js:1-49`, `.github/workflows/ci.yml:101-116` (job `assets`), `package.json:2-5` (`scripts`)
- **Problema encontrado:** `tsconfig.json` declara `"strict": true`, mas nada no pipeline chama `tsc --noEmit`. O build de produção (`npm run build` = `vite build`) usa o plugin `@vitejs/plugin-react`, que faz apenas transpilação via esbuild — não há checagem de tipos. O job `assets` do CI (`ci.yml:101-116`) roda só `npm ci && npm run build`. `package.json` não tem nenhum script `typecheck`/`test`. Resultado prático: rodei `npx tsc --noEmit -p tsconfig.json` agora e o repositório **já tem 6 erros de tipo reais** (ver achados #2 a #4), sem que build ou CI acusem nada.
- **Por que isso é um problema:** o `strict: true` dá uma falsa sensação de segurança — quem lê o `tsconfig.json` assume que o projeto é checado, mas na prática qualquer PR pode introduzir erro de tipo e passar verde no CI. Os erros já acumulados aqui são pequenos, mas em um projeto que cresce isso tende a virar dívida silenciosa e difícil de descobrir depois.
- **Evidência:**
  ```
  $ npx tsc --noEmit -p tsconfig.json
  resources/js/app/hooks/useOnboarding.ts(1,10): error TS1484: 'FormEvent' is a type and must be imported using a type-only import...
  resources/js/bio/lib/loadBioConfig.ts(5,5): error TS2717: Subsequent property declarations must have the same type...
  resources/js/editor/components/item-editors/AppHeroItemFields.tsx(19,65): error TS2322: Type '(item: WhatsAppHero) => void' is not assignable to type '(item: WhatsAppHero | AppHero) => void'...
  ```
- **Refatoração sugerida:**
  1. Corrigir os 6 erros listados nos achados #2-#4 deste arquivo (mudanças pequenas e isoladas).
  2. Adicionar em `package.json` → `"scripts"`: `"typecheck": "tsc --noEmit -p tsconfig.json"`.
  3. Adicionar um step `run: npm run typecheck` no job `assets` de `.github/workflows/ci.yml` (antes ou depois de `npm run build`), para que qualquer novo erro quebre o CI a partir de agora.

## Achado #2 — Declaração global de `Window` duplicada e com tipos conflitantes
- **Severidade:** Médio
- **Categoria:** Duplicação / Boas práticas TypeScript
- **Local:** `resources/js/vite-env.d.ts:11-17` e `resources/js/bio/lib/loadBioConfig.ts:3-11`
- **Problema encontrado:** as mesmas cinco propriedades globais (`__BIO_CONFIG__`, `__BIO_JSON_PATH__`, `__ANALYTICS_KEY__`, `__ANALYTICS_URL__`, `__BIO_WATERMARK__`) são declaradas em `interface Window` duas vezes, em arquivos diferentes, com tipos diferentes para a mesma propriedade (`__BIO_CONFIG__?: unknown` em `vite-env.d.ts:12` vs `__BIO_CONFIG__?: BioConfig` em `loadBioConfig.ts:5`). TypeScript faz merge de interfaces globais, então isso é aceito silenciosamente até o tipo divergir — que é exatamente o que já aconteceu.
- **Por que isso é um problema:** é uma única fonte de verdade duplicada por acidente. Quem for adicionar uma nova global (comum nesse projeto, que injeta config via `window.__X__` do PHP) não sabe qual dos dois arquivos editar, e o TypeScript já está travado com esse erro (`TS2717`) agora mesmo, quebrando `tsc --noEmit`.
- **Evidência:**
  ```ts
  // resources/js/vite-env.d.ts:11-17
  interface Window {
    __BIO_CONFIG__?: unknown
    ...
  }

  // resources/js/bio/lib/loadBioConfig.ts:3-11
  declare global {
    interface Window {
      __BIO_CONFIG__?: BioConfig
      ...
    }
  }
  ```
- **Refatoração sugerida:**
  1. Remover o bloco `declare global { interface Window {...} }` de `loadBioConfig.ts:3-11`.
  2. Em `vite-env.d.ts:12`, trocar `__BIO_CONFIG__?: unknown` por `__BIO_CONFIG__?: BioConfig` (importando o tipo `BioConfig` de `./bio/types/bio`), deixando `vite-env.d.ts` como única fonte das globais de `window`.

## Achado #3 — `FormEvent` importado como valor em vez de tipo (viola `verbatimModuleSyntax`)
- **Severidade:** Baixo
- **Categoria:** Boas práticas TypeScript
- **Local:** `resources/js/app/hooks/useOnboarding.ts:1`, `resources/js/app/hooks/useSettings.ts:1`
- **Problema encontrado:** `tsconfig.json:14` liga `"verbatimModuleSyntax": true`, que exige `import type` para símbolos usados apenas como tipo. Os dois hooks fazem `import { FormEvent, useMemo, useState } from 'react'` misturando um tipo (`FormEvent`) com valores (`useMemo`, `useState`) no mesmo import sem `type`. O restante do projeto usa `import type { ... }` corretamente (ex.: `resources/js/editor/EditorApp.tsx:26` `import type { BioConfig } from '@bio-types'`), então isso é uma exceção isolada ao padrão do próprio repo, não um estilo alternativo válido.
- **Por que isso é um problema:** quebra `tsc --noEmit` (erro `TS1484`) e é inconsistente com o resto do código, que sempre separa `import type`.
- **Evidência:**
  ```ts
  // resources/js/app/hooks/useOnboarding.ts:1
  import { FormEvent, useMemo, useState } from 'react'

  // resources/js/app/hooks/useSettings.ts:1
  import { FormEvent, useEffect, useState } from 'react'
  ```
- **Refatoração sugerida:** trocar por `import { useMemo, useState } from 'react'` + `import type { FormEvent } from 'react'` em cada um dos dois arquivos (ou `import { useMemo, useState, type FormEvent } from 'react'`, no padrão já usado em `resources/js/editor/components/PagesPanel.tsx:1`).

## Achado #4 — `HeroLayoutFields` aceita um tipo mais amplo do que os callers fornecem
- **Severidade:** Médio
- **Categoria:** Boas práticas TypeScript
- **Local:** `resources/js/editor/components/item-editors/HeroLayoutFields.tsx:5-13` (prop `onChange`), consumido por `resources/js/editor/components/item-editors/AppHeroItemFields.tsx:9-21` e `:23-31`
- **Problema encontrado:** `HeroLayoutFields` declara `onChange: (item: WhatsAppHero | AppHero) => void` (união). `WhatsAppHeroItemFields` (linha 16) passa um `onChange: (item: WhatsAppHero) => void` e `AppHeroItemFields` (linha 30) passa `onChange: (item: AppHero) => void` — ambos mais estreitos que a união exigida, o que o `tsc` rejeita (`TS2322`) porque a função recebida não sabe lidar com o outro membro da união.
- **Por que isso é um problema:** o componente genérico está tipado de um jeito que nenhum dos dois únicos usos reais consegue satisfazer sem o erro já existir hoje — ou seja, o tipo declarado não reflete o contrato real. Isso é o tipo de erro que passa despercebido justamente porque (achado #1) nada roda `tsc` no CI.
- **Evidência:**
  ```ts
  // HeroLayoutFields.tsx:5-13
  export function HeroLayoutFields({ item, isGridSection, onChange }: {
    item: WhatsAppHero | AppHero
    isGridSection: boolean
    onChange: (item: WhatsAppHero | AppHero) => void
  }) { ... }
  ```
- **Refatoração sugerida:** tornar `HeroLayoutFields` genérico no tipo do item, mantendo um único componente:
  ```ts
  export function HeroLayoutFields<T extends WhatsAppHero | AppHero>({
    item, isGridSection, onChange,
  }: { item: T; isGridSection: boolean; onChange: (item: T) => void }) { ... }
  ```
  Isso preserva o componente compartilhado (não há necessidade de duplicá-lo) e faz `AppHeroItemFields`/`WhatsAppHeroItemFields` tipar corretamente sem `as`.
