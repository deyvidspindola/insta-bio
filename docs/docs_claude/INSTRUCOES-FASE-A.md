# Fase A — instruções de instalação

Testei a lógica do script isoladamente (staging, exclusão de arquivos sensíveis,
geração do `manifest.json` com sha256, atualização idempotente do `updates.json`,
limpeza de temporários) contra um monorepo simulado, usando um stub local no
lugar do `archiver` real (não tenho acesso à internet neste ambiente para
instalar pacotes npm). O fluxo passou em todos os casos, incluindo:

- rodar duas vezes com a mesma versão → sobrescreve, não duplica
- `editor/auth.config.php` (e demais arquivos sensíveis) nunca aparecem no zip
- `VERSION` vazio → falha com mensagem clara, exit code 1
- staging (`dist/updates/_staging/`) sempre limpo ao final

**No seu repositório real, com o `archiver` de verdade, é importante rodar os
testes abaixo antes de considerar a Fase A pronta** — o stub não valida se o
zip gerado é um ZIP válido de verdade.

## 1. Arquivos deste pacote

- `VERSION` → copiar para a **raiz** do monorepo. Contém `1.0.0` como placeholder —
  **ajuste para a versão atual real do produto** antes de commitar.
- `scripts/build-update-package.mjs` → copiar para `scripts/` na raiz.

## 2. Dependência nova

Na raiz do monorepo:

```bash
npm install --save-dev archiver
```

## 3. Script novo no `package.json` raiz

Adicionar em `"scripts"`:

```json
"build:update-package": "node scripts/build-update-package.mjs"
```

## 4. `.gitignore`

Adicionar (é artefato de build, não deve ir pro git):

```
dist/updates/
```

## 5. Como testar no seu ambiente

```bash
npm run build:update-package
```

Depois:

- [ ] `unzip -l dist/updates/insta-bio-{VERSION}.zip` → deve mostrar `manifest.json`,
      `site/`, `editor/` na raiz do zip, sem `editor/editor/`.
- [ ] `unzip -p dist/updates/insta-bio-{VERSION}.zip manifest.json | python3 -m json.tool`
      → conferir lista `files` e `preserve`.
- [ ] Extrair o zip e conferir `sha256sum` de um arquivo qualquer contra o valor
      no `manifest.json`.
- [ ] `cat dist/updates/updates.json` → `latest` deve bater com `VERSION`.
- [ ] `shasum -a 256 dist/updates/insta-bio-{VERSION}.zip` → deve bater com
      `updates.json.packages["{VERSION}"].sha256`.
- [ ] Rodar `npm run build:update-package` de novo → mesma versão, mesma entrada
      sobrescrita (não duplicada) em `updates.json`.
- [ ] Extrair o zip e confirmar que **nenhum** destes arquivos está presente:
      `auth.config.php`, `bio.json`, `bio.draft.json`, `bio-path.json`,
      `platform-api.json`, `update-state.json`.

## 6. Passar changelog

```bash
npm run build:update-package -- --changelog="Correção de imagens em subpasta"
```

## 7. Debug rápido (sem rebuildar tudo)

Se `dist/` e `editor/dist/` já estão atualizados e você só quer testar o
empacotamento:

```bash
npm run build:update-package -- --skip-build
```

## O que esta fase NÃO faz (de propósito)

- Não sobe nada em produção (isso é Fase E).
- Não expõe `dist/updates/` publicamente nem gera URL assinada — o campo
  `url` em `updates.json` é só o nome do arquivo local, para as fases C/D
  decidirem como servir com autenticação.
- Não mexe em PHP, React, `AdvancedPanel.tsx` nem `sync-clients-template.mjs`.
