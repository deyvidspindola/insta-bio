# Deploy na HostGator — passo a passo

Guia para publicar o **site da bio** e o **editor** em hospedagem compartilhada (sem Node, sem MySQL no cliente).

---

## O que você vai publicar

| Parte | URL típica | Tecnologia |
|-------|------------|------------|
| Bio pública | `https://seudominio.com/` | HTML + JS estático + `bio.json` |
| Editor | `https://seudominio.com/editor/` | React compilado + **PHP** |

O build roda **no seu computador** (Node.js). Na HostGator você envia arquivos prontos via FTP ou Gerenciador de Arquivos.

---

## Pré-requisitos

### No computador

- [Node.js](https://nodejs.org/) 20+
- Repositório clonado

```bash
cd insta-bio
make install
# ou: npm install --prefix bio && npm install --prefix editor
```

### Na HostGator

- PHP habilitado
- cPanel (FTP ou Gerenciador de Arquivos)
- Domínio com **SSL** (Let's Encrypt no cPanel)

---

## Passo 1 — Caminho público (se não for a raiz)

Se a bio ficar em subpasta (`https://dominio.com/insta-bio/`):

```bash
cp deploy.config.example.json deploy.config.json
```

```json
{ "basePath": "/insta-bio/" }
```

Ou: `make package BASE_PATH=/insta-bio`

Para a **raiz do domínio**, use `"/"` ou omita o arquivo.

---

## Passo 2 — Gerar o pacote (recomendado)

```bash
make package
# ou: npm run build:package
```

Cria **`release/`** com bio + editor:

```
release/
├── index.html
├── bio.json
├── bio-path.json      (se configurado no editor)
├── bio-json.php       (proxy opcional)
├── assets/
└── editor/
    ├── index.html
    ├── login.php
    └── …
```

Suba **todo o conteúdo** de `release/` para a pasta do domínio no servidor.

---

## Passo 2 (alternativo) — Builds separados

```bash
npm run build              # → dist/ na raiz do repo
npm run editor:hostgator   # → editor/dist/
```

| Local | Remoto |
|-------|--------|
| `dist/*` | `public_html/` |
| `editor/dist/*` | `public_html/editor/` |

---

## Passo 3 — Login do editor

### 3.1 Hash da senha

```bash
make hash-password PASSWORD="SenhaForteDoCliente123"
# ou: npm run hash-password --prefix editor -- "SenhaForteDoCliente123"
```

### 3.2 `auth.config.php`

```bash
cp editor/php/auth.config.example.php editor/php/auth.config.php
```

Edite `editor/php/auth.config.php`:

```php
define('AUTH_USERNAME', 'admin');
define('AUTH_PASSWORD_HASH', '$2a$10$...'); // hash gerado
define('BIO_JSON_PATH', __DIR__ . '/../bio.json');
define('ASSETS_DIR', __DIR__ . '/../assets');
```

> Não commite `auth.config.php`. No servidor, preserve este arquivo ao atualizar o editor.

Caminhos padrão: editor em `/editor/`, bio na raiz. Se o `bio.json` ficar em subpasta (ex.: `painel/bio.json`), configure no editor → **Configurações** → caminho do arquivo — isso atualiza `auth.config.php` e gera `bio-path.json`.

---

## Passo 4 — Build do editor

```bash
npm run editor:hostgator
```

Gera `editor/dist/` com HTML, JS, PHP e `.htaccess`.

---

## Passo 5 — Enviar para a HostGator

1. **Bio:** conteúdo de `dist/` ou `release/` (raiz) → `public_html/`
2. **Editor:** conteúdo de `editor/dist/` → `public_html/editor/`
3. Confirme `auth.config.php` e permissões de escrita em `bio.json` e `assets/`

---

## Estrutura final no servidor

```
public_html/
├── index.html
├── index.php              (clientes da plataforma — licença)
├── bio.json
├── bio-path.json          (opcional — caminho customizado)
├── bio-json.php           (opcional — proxy PHP)
├── assets/
└── editor/
    ├── index.html
    ├── platform-api.json  (clientes com login no painel central)
    ├── auth.config.php
    ├── login.php
    ├── save.php
    ├── publish.php
    ├── upload.php
    └── .htaccess
```

---

## Passo 6 — Testar

| Teste | URL | Esperado |
|-------|-----|----------|
| Bio pública | `/` | Página carrega |
| Editor | `/editor/` | Login |
| Salvar | Editar → **Salvar** | `bio.draft.json` (rascunho) |
| Publicar | **Publicar** | `bio.json` atualizado |
| Upload | Enviar imagem | Arquivo em `assets/` |
| Preview | Painel lateral | Imagens e vídeos corretos |

---

## Bio em subpasta (ex.: `painel/bio.json`)

Alguns clientes guardam o JSON fora da raiz:

1. No editor → **Configurações** → informe o caminho absoluto ou relativo
2. Salve — gera `bio-path.json` na raiz e atualiza `auth.config.php`
3. Assets ficam na **mesma pasta** do JSON (`painel/assets/`)
4. Suba `bio-json.php` na raiz se a URL direta do JSON não funcionar

A bio pública lê o caminho nesta ordem: `__BIO_JSON_PATH__` (index.php) → `bio-path.json` → `bio-json.php` → `bio.json`.

---

## Atualizar template (nova versão)

### Clientes single-tenant (domínio próprio) — atualização pelo editor

A partir da versão com suporte a updates remotos, o cliente pode atualizar sem FTP:

1. Entre no editor → **Configurações**
2. Clique em **Buscar atualizações**
3. Se houver versão nova, clique em **Atualizar agora**

O sistema baixa o pacote assinado da plataforma, valida o SHA-256, faz backup em `editor/.update-backup/` e substitui os arquivos do template **preservando** `bio.json`, `assets/` (imagens), `auth.config.php` e `update-state.json` (reescrito ao final).

Se algo falhar, o backup permanece para restauração manual (copiar de volta os arquivos de `editor/.update-backup/YYYYMMDD_HHMMSS/`).

Detalhes técnicos ficam em **`editor/update.log`** (bloqueado no HTTP). Em caso de erro no check/apply, abra esse arquivo via FTP/SSH para ver a causa (checksum, download, licença, etc.).

### Atualização manual via FTP (legado / emergência)

```bash
npm run build
npm run editor:hostgator
# opcional — gera ZIP para a plataforma servir aos clientes self-hosted:
npm run build:update-package
```

Por FTP:

1. Substitua arquivos da bio (**preserve** `bio.json`, `assets/`, `bio-path.json`)
2. Substitua arquivos do editor (**preserve** `auth.config.php`)

Checklist completo de release: [ATUALIZACOES-REMOTAS.md](./ATUALIZACOES-REMOTAS.md).

---

## Problemas comuns

### Página em branco / erro ao carregar bio.json

- Confira `bio-path.json` e `auth.config.php` (caminho do JSON)
- Verifique se `bio-json.php` existe na raiz
- Console do navegador (F12) — erros de caminho JS/CSS

### Editor: erro 500

- `auth.config.php` presente?
- Permissões: pastas `755`, arquivos `644`; `bio.json` e `assets/` graváveis

### Imagens não carregam na bio (mas funcionam no preview)

- Assets devem estar na **mesma pasta** do `bio.json` (`painel/assets/` se JSON está em `painel/`)
- Re-salve o caminho no editor para regenerar `bio-path.json`
- Suba build novo da bio (`npm run build`)

### Salvar não reflete no site

- Use **Publicar**, não só **Salvar** (rascunho ≠ publicado)
- `BIO_JSON_PATH` correto no `auth.config.php`
- Ctrl+F5 no navegador

### Login do editor em cliente da plataforma

Clientes com licença usam login via API do painel (`editor/platform-api.json`). Não é o `auth.config.php` local.

---

## Documentos relacionados

- [DEPLOY-ATUALIZACAO.md](./DEPLOY-ATUALIZACAO.md) — estrutura pós-build e o que subir
- [EDITOR.md](./EDITOR.md) — funcionalidades do editor
- [COMERCIALIZACAO.md](./COMERCIALIZACAO.md) — instalar para clientes
- [BIO-JSON.md](./BIO-JSON.md) — referência do conteúdo
- [PLATAFORMA.md](./PLATAFORMA.md) — multi-cliente com `/panel/`
- [ATUALIZACOES-REMOTAS.md](./ATUALIZACOES-REMOTAS.md) — updates remotos (single-tenant)
