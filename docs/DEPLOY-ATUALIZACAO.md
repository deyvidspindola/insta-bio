# Deploy e atualização — o que buildar e o que subir

Guia operacional: **comandos → pastas geradas → o que enviar no FTP** (e o que nunca sobrescrever).

Versão canônica do monorepo: arquivo `VERSION` na raiz (SemVer, ex.: `1.0.0`).

---

## Visão rápida: três destinos

| Destino | Para quem | Comando principal | Pasta gerada | Onde sobe no servidor |
|---------|-----------|-------------------|--------------|------------------------|
| **Single-tenant** | Cliente em domínio próprio | `make package` | `release/` | Raiz do domínio (`public_html/`) |
| **Plataforma** | multi-cliente | `make platform-core` | `platform-release/` (inclui ZIP) | Raiz + `/panel/` + `/_template/` |
| **Updates (fonte única)** | Todos os clientes (editor + painel “atualizar todos” + novos clientes) | incluso no platform-core **ou** `make update-package` | `dist/updates/` → `panel/data/updates/` | Sempre na plataforma |

O ZIP é a **única fonte** de template: apply no editor, sync em massa no painel e provisionamento de novos clientes.

Builds intermediários (úteis para debug):

| Comando | Saída |
|---------|--------|
| `npm run build` | `dist/` — bio pública |
| `npm run editor:hostgator` | `editor/dist/` — editor + PHP |
| `npm run build:template` | `platform-template/_template/` — modelo de cliente |

---

## 1. Single-tenant (domínio do cliente)

### Como gerar

```bash
# Pacote unificado (bio + editor) — também gera o ZIP de update
make package
# ou: npm run build:package
```

`make package` dispara `build:update-package`, que **incrementa `VERSION` (patch)** e gera o changelog automaticamente (a menos que você use `--no-bump` / `--set-version`).

### Estrutura de `release/`

```
release/
├── index.html              ← bio pública
├── suspended.html
├── favicon.svg, icons.svg, logo-instabio.svg
├── assets/                 ← bundles JS/CSS da bio (+ mídia se houver no build)
├── .htaccess
├── bio.json / bio.draft.json   ← só no 1º deploy; depois NÃO sobrescrever
└── editor/
    ├── index.html
    ├── preview.html
    ├── assets/             ← bundles do editor (index-*.js, preview-*.js, …)
    ├── *.php               ← API (login, save, update-*.php, …)
    ├── .htaccess
    ├── update-state.json   ← versão instalada (gerado no package)
    ├── .update-tmp/        ← temp do apply (Deny)
    ├── .update-backup/     ← backups do apply (Deny)
    └── update.log          ← log de check/apply (Deny; gerado em runtime)
    └── auth.config.php     ← só se existir no build local; no servidor PRESERVAR
```

### O que subir (FTP)

| Situação | Subir | Preservar no servidor |
|----------|--------|------------------------|
| **Primeira instalação** | Todo o conteúdo de `release/` | — |
| **Atualizar template (FTP manual)** | `index.html`, `suspended.html`, ícones, `assets/` (bundles), pasta `editor/` (HTML/JS/CSS/PHP) | `bio.json`, `bio.draft.json`, `bio-path.json`, imagens do cliente em `assets/`, `editor/auth.config.php`, `editor/platform-api.json` (se houver), `editor/update-state.json` (ou deixe o apply remoto reescrever) |
| **Atualizar pelo editor** | Nada via FTP — cliente usa **Configurações → Buscar atualizações → Atualizar agora** | O apply já preserva dados |

### Preferência: update remoto (sem FTP no cliente)

1. Gere o ZIP na sua máquina (`make update-package` ou via `make package`).
2. Suba o ZIP + `updates.json` **só na plataforma** (seção 3).
3. No editor do cliente: **Buscar atualizações → Atualizar agora**.

---

## 2. Plataforma (multi-cliente)

### Como gerar

```bash
echo "1.0.1" > VERSION
make platform-core
# ou com landing: npm run build:platform
```

Isso já gera o ZIP de update remoto e coloca em `platform-release/panel/data/updates/`.

### Estrutura típica de `platform-release/`

```
platform-release/
├── index.html / assets/ …     ← landing comercial (raiz do domínio)
├── panel/
│   ├── index.html + assets/   ← SPA do painel
│   ├── *.php / lib/           ← API PHP
│   ├── .htaccess
│   ├── db.config.php          ← NÃO vem do build; configurar no servidor
│   └── data/updates/          ← ZIP + updates.json (gerado no platform-core/platform)
└── _template/                 ← modelo copiado para cada /{slug}/
    ├── index.html, assets/, …
    ├── bio.json (mínimo)
    └── editor/                ← sem auth.config.php do cliente
        └── update-state.json
```

No servidor, a árvore efetiva costuma ser:

```
public_html/
├── (landing)
├── panel/
│   ├── … (código do painel)
│   ├── sites/{slug}/          ← clientes (criados pelo painel)
│   └── data/updates/          ← ZIPs + updates.json (updates remotos)
└── _template/                 ← substituir a cada release de template
```

### O que subir ao atualizar a plataforma

| Pasta / arquivo | Ação | Preservar |
|-----------------|------|-----------|
| Landing (raiz) | Substituir HTML/assets do build | — |
| `panel/` (código: HTML, JS, PHP, `.htaccess`) | Substituir | `panel/php/db.config.php`, `panel/sites/` (clientes) |
| `panel/data/updates/` | Substituir/mesclar ZIP + `updates.json` do release | Outros dados em `panel/data/` se houver |
| `_template/` | **Substituir inteiro** pelo novo build | — |
| Clientes `/{slug}/` | **Não** subir manualmente | Propagar com **Atualizar sites** no `/panel/` (ou `npm run sync:clients` em dev) |

Depois de trocar `_template/`: no painel, **Sincronizar / Atualizar sites** para copiar bio+editor aos clientes (preserva `bio.json`, imagens, `auth.config.php`).

---

## 3. Pacote de atualização remota (ZIP)

Usado pelos clientes **single-tenant** (licença ativa) via editor. A plataforma **hospeda** o ZIP; o cliente **baixa** com URL assinada.

### Como gerar

```bash
# Builds + bump VERSION (patch) + changelog git + ZIP + updates.json
make update-package

# Opções:
npm run build:update-package -- --bump=minor
npm run build:update-package -- --set-version=1.2.0
npm run build:update-package -- --no-bump
npm run build:update-package -- --changelog="Texto manual (opcional)"

# Se dist/ e editor/dist/ já estão frescos:
npm run build:update-package -- --skip-build
```

O changelog entra em `updates.json` e no `manifest.json` — frases para o usuário **só do que mudou desde o último `make update-package`** (stamp local). Sem lista de arquivos.

### Estrutura gerada

```
dist/updates/
├── updates.json                 ← manifesto (latest + histórico)
└── insta-bio-{VERSION}.zip      ← pacote aplicado no cliente

panel/data/updates/              ← espelho automático (mesmo conteúdo + .htaccess Deny)
├── .htaccess
├── updates.json
└── insta-bio-{VERSION}.zip
```

### Dentro do ZIP

```
insta-bio-1.0.1.zip
├── manifest.json                ← version, lista de arquivos + sha256, preserve[]
├── site/                        ← o que vai na raiz do cliente (bio)
│   ├── index.html
│   ├── assets/                  ← principalmente bundles (index-*.js|css)
│   └── …
└── editor/                      ← o que vai em /editor/
    ├── index.html, preview.html
    ├── assets/
    ├── *.php (inclui update-apply.php, …)
    └── …
```

**Não entram no ZIP** (e o apply não sobrescreve no cliente):

- `bio.json`, `bio.draft.json`, `bio-path.json`
- `editor/auth.config.php`
- `editor/platform-api.json`
- `editor/update-state.json` (reescrito só no final do apply)

### O que subir na plataforma

Copie **sempre os dois** para o servidor da plataforma:

| Local (seu PC) | Remoto (plataforma) |
|----------------|---------------------|
| `dist/updates/updates.json` | `panel/data/updates/updates.json` |
| `dist/updates/insta-bio-*.zip` | `panel/data/updates/insta-bio-*.zip` |

Mantenha o `.htaccess` com `Require all denied` nessa pasta (o script de build já grava no espelho local).

**Não** publique o ZIP em URL pública permanente. O download passa por:

`POST /panel/api/updates/package` → URL assinada → `GET /panel/api/updates/download?…`

### Checklist mínimo de release com update remoto

1. `make update-package` (ou `make package`) — bump + changelog + ZIP automáticos
2. Conferir: `cat VERSION` e `unzip -l dist/updates/insta-bio-$(cat VERSION).zip`
3. Subir ZIP + `updates.json` → `panel/data/updates/` na plataforma
4. (Plataforma) Se mudou template multi-cliente: subir `_template/` + sync no painel
5. Testar em um cliente self-hosted: Buscar atualizações → Atualizar agora

---

## 4. Mapa mental: de onde vem cada pasta

```
bio/  ──build──►  dist/  ──────────────┐
                                       ├── make package ──► release/
editor/ ──hostgator──► editor/dist/ ───┘         │
                                                 ├── update-package ──► dist/updates/*.zip
                                                 └── espelho ──► panel/data/updates/

bio + editor (template) ──► platform-template/_template/
site + panel + _template ──► platform-release/
```

---

## 5. O que **nunca** sobrescrever no servidor do cliente

| Arquivo / pasta | Por quê |
|-----------------|---------|
| `bio.json` / `bio.draft.json` | Conteúdo do cliente |
| `assets/` com imagens/vídeos do cliente | Mídia enviada pelo editor |
| `bio-path.json` | Caminho customizado do JSON |
| `editor/auth.config.php` | Login / caminhos locais |
| `editor/platform-api.json` | Clientes da plataforma (login remoto) |
| `license.config.php` | Licença self-hosted |
| `editor/.update-backup/` | Backups de applies anteriores |
| `editor/update.log` | Log de erros/etapas do check e apply (FTP/SSH) |

Bundles antigos (`index-OLDHASH.js`, etc.) o apply/sync **remove** de propósito ao instalar os novos.

---

## 6. Comandos de referência

| Objetivo | Comando |
|----------|---------|
| Pacote FTP single-tenant | `make package` |
| Só bio | `npm run build` → `dist/` |
| Só editor+PHP | `npm run editor:hostgator` → `editor/dist/` |
| Template multi-cliente | `npm run build:template` |
| Plataforma completa | `npm run build:platform` (inclui ZIP updates) |
| Plataforma sem landing | `make platform-core` (inclui ZIP updates) |
| ZIP de update remoto (avulso) | `make update-package` |
| Propagar template → clientes locais | `npm run sync:clients` |

---

## Documentos relacionados

- [HOSTGATOR.md](./HOSTGATOR.md) — FTP single-tenant passo a passo
- [PLATAFORMA.md](./PLATAFORMA.md) — multi-cliente e `_template/`
- [ATUALIZACOES-REMOTAS.md](./ATUALIZACOES-REMOTAS.md) — fluxo check/apply e segurança
- [COMERCIALIZACAO.md](./COMERCIALIZACAO.md) — entrega e manutenção comercial
