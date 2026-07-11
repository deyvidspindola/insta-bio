# Fase B — instruções de instalação

## O que foi testado neste ambiente e o que NÃO foi

- ✅ `editor/src/lib/updates.ts` — checado com `tsc --strict` (sem `@types/react`,
  já que não usa JSX). Compilou sem erros.
- ✅ `formatDate()` do `UpdatesCard.tsx` — testada isoladamente com `node` para
  os casos `null`, `undefined`, data inválida e data válida.
- ✅ `scripts/lib/write-update-state.mjs` — testado com `node`, grava o JSON
  esperado.
- ⚠️ `editor/php/update-status.php` — **não** consegui rodar (não há PHP neste
  sandbox). Segue o boilerplate real de `save.php` documentado em
  `PADROES-ATUALIZACOES-REMOTAS.md` § 4, só acrescentando guard de método e
  headers de cache. Rode `php -l editor/php/update-status.php` no seu ambiente
  antes de subir.
- ⚠️ `UpdatesCard.tsx` completo (com JSX) — não type-checado automaticamente
  (sem `@types/react` disponível aqui). Revisei a estrutura manualmente contra
  o padrão de `AdvancedPanel` do doc de padrões. Rode o `tsc`/build normal do
  projeto para confirmar.

## 1. Arquivos deste pacote

| Arquivo | Destino no monorepo |
|---|---|
| `editor/php/update-status.php` | `editor/php/update-status.php` |
| `editor/src/lib/updates.ts` | `editor/src/lib/updates.ts` |
| `editor/src/components/UpdatesCard.tsx` | `editor/src/components/UpdatesCard.tsx` |
| `scripts/lib/write-update-state.mjs` | `scripts/lib/write-update-state.mjs` |

## 2. `editor/src/lib/endpoints.ts` — adicionar uma linha

```ts
export const ENDPOINTS = {
  session: 'api/auth/session',
  // … existentes …
  paths: 'api/bio/paths',
  updateStatus: 'api/update/status', // NOVO
} as const
```

## 3. Apache — mapear a rota nova

O rewrite `api/... → *.php` já existe no editor (usado por `api/auth/session`,
`api/bio/paths` etc.). **Preciso que você confirme** a regra atual do
`.htaccess` do editor e adicione (ou confirme que já cobre por convenção)
o mapeamento:

```
api/update/status  →  update-status.php
```

Não tenho o `.htaccess` real para editar com segurança — só liste a regra
existente (ex.: `RewriteRule ^api/bio/paths$ paths.php`) que eu ajusto o
padrão para `update-status.php` no próximo passo.

## 4. Integrar o card em `AdvancedPanel.tsx`

No arquivo existente, importar e renderizar o novo card dentro da aba
Configurações, ao lado dos outros `<div className="card">` já existentes:

```tsx
import { UpdatesCard } from './UpdatesCard'

// … dentro do JSX da aba Configurações, junto dos outros cards:
<UpdatesCard />
```

Não reescrevi o `AdvancedPanel.tsx` inteiro de propósito — não tenho o
arquivo real e uma reescrita "às cegas" arriscaria derrubar outros cards já
existentes. `UpdatesCard` foi feito como componente isolado (mesmo padrão de
hooks/estados do doc de padrões) só para importar e plugar.

## 5. Gravar `update-state.json` no pacote/release

Em qualquer script que hoje copia `editor/dist/` para o destino final
(`scripts/package-deploy.mjs` para single-tenant, e o equivalente para o
template da plataforma), importar o helper novo e chamar depois de copiar os
arquivos do editor:

```js
import { writeUpdateState } from './lib/write-update-state.mjs'
import { readVersion } from '???' // reaproveitar a mesma leitura de VERSION da Fase A

// depois de copiar editor/dist/ → <destino>/editor/
writeUpdateState(path.join(destino, 'editor'), version)
```

Não tenho `package-deploy.mjs` real para editar — o helper foi feito separado
(`scripts/lib/write-update-state.mjs`) exatamente para você importar nos
pontos certos sem eu arriscar reescrever um script que já funciona.

**Atenção:** isso grava a versão de build no **pacote/release** que sai da
sua máquina — é diferente do `update-state.json` que existirá no **servidor
do cliente** depois de um apply real (Fase D). Aqui é só o valor inicial que
vai junto no deploy/FTP.

## 6. Checklist de teste (humano)

- [ ] `php -l editor/php/update-status.php` sem erro de sintaxe.
- [ ] Logado no editor, `GET api/update/status` retorna `200` com
      `{ ok: true, state: {...}, platformManaged: false|true }`.
- [ ] Sem sessão, `GET api/update/status` retorna `401`.
- [ ] Cliente com `editor/platform-api.json` → `platformManaged: true` e o
      card mostra "Atualizações gerenciadas pela plataforma." **sem** nenhum
      botão.
- [ ] Cliente sem `platform-api.json` → mostra versão/data e o texto
      placeholder, também **sem** botão (fase B é só leitura).
- [ ] Rodar o build/deploy → `editor/update-state.json` aparece no pacote
      gerado, com a versão correta.
- [ ] Se `update-state.json` não existir no servidor (cliente legado), o
      card mostra `"desconhecida"` e `"nunca"` sem quebrar.

## O que esta fase NÃO faz (de propósito)

- Não tem botão "Buscar atualizações" nem chama API de licença (Fase C).
- Não faz apply nem download de ZIP (Fase D).
- Não altera `sync-clients-template.mjs` do painel — grava `updatedAt` do
  sync de plataforma é tarefa da Fase 4/E, opcional.
