# insta-bio

Template de **link da bio** para Instagram — inspirado no [Voe Connect](https://voeconnect.com.br/bio).

O conteúdo da página fica em **`bio.json`**. Depois do deploy inicial, dá para atualizar textos e links **sem rebuild** — pelo editor online ou trocando o arquivo no servidor.

---

## Início rápido (desenvolvimento)

```bash
make install
# ou manualmente:
# npm install --prefix bio --prefix editor --prefix panel --prefix site

make dev-all         # bio + editor + painel + landing (recomendado)
# ou separado:
npm run dev          # Bio → http://localhost:5173
npm run editor       # Editor → http://localhost:5180
npm run panel        # Painel → http://localhost:5175/panel/
npm run site         # Landing → http://localhost:5190
```

**Login local do editor:** `admin@local.dev` / `admin123` (arquivo `editor/auth.json`).

Na primeira abertura, se não existir `bio/public/bio.json`, o Vite cria um a partir de `editor/public/demo-bio.json`. Dashboard em `:5180` usa analytics mockados.

**Demo do editor:** [http://localhost:5180/demo.html](http://localhost:5180/demo.html)

---

## Publicar (produção)

Dois comandos — o resto está em [docs/DEPLOY-ATUALIZACAO.md](./docs/DEPLOY-ATUALIZACAO.md).

```bash
make platform-core      # plataforma → platform-release/  (sobe no /panel/)
make update-package     # ZIP de update → clientes atualizam pelo editor
```

**Guia “o que subir onde”:** [docs/DEPLOY-ATUALIZACAO.md](./docs/DEPLOY-ATUALIZACAO.md)

**HostGator / single-tenant:** [docs/HOSTGATOR.md](./docs/HOSTGATOR.md)  
**Plataforma multi-cliente:** [docs/PLATAFORMA.md](./docs/PLATAFORMA.md)  
**Vender / instalar clientes:** [docs/COMERCIALIZACAO.md](./docs/COMERCIALIZACAO.md)

---

## Documentação

| Documento | Para quem | Conteúdo |
|-----------|-----------|----------|
| [HOSTGATOR.md](./docs/HOSTGATOR.md) | Deploy | FTP, login PHP, testes, problemas comuns |
| [DEPLOY-ATUALIZACAO.md](./docs/DEPLOY-ATUALIZACAO.md) | Operação | **O que buildar, estrutura gerada e o que subir no FTP** |
| [COMERCIALIZACAO.md](./docs/COMERCIALIZACAO.md) | Negócio | Novo cliente, checklist, manutenção |
| [EDITOR.md](./docs/EDITOR.md) | Editor | Funcionalidades, fluxo salvar/publicar |
| [BIO-JSON.md](./docs/BIO-JSON.md) | Conteúdo | Campos, cards, ícones, exemplos |
| [PROJETO.md](./docs/PROJETO.md) | Desenvolvedor | Arquitetura e código |
| [PLATAFORMA.md](./docs/PLATAFORMA.md) | Plataforma | Multi-cliente, `/panel/`, MySQL |
| [MELHORIAS.md](./docs/MELHORIAS.md) | Produto | Roadmap e prioridades |
| [ATUALIZACOES-REMOTAS.md](./docs/ATUALIZACOES-REMOTAS.md) | Operação | Atualização remota (single-tenant): release, ZIP, check/apply |
| [site/README.md](./site/README.md) | Comercial | Landing page de vendas |
| [panel/README.md](./panel/README.md) | Plataforma | Painel super-admin |

---

## Monorepo

| Pasta | O que é | Porta dev | Build |
|-------|---------|-----------|-------|
| `bio/` | Bio pública (React + `bio.json`) | 5173 | `dist/` na **raiz** |
| `editor/` | Editor visual + PHP | 5180 | `editor/dist/` |
| `panel/` | Super-admin (cadastro de clientes) | 5175 | `panel/dist/` + PHP |
| `site/` | Landing comercial | 5190 | `site/dist/` |
| `scripts/` | Pacotes de deploy (`release/`, `platform-release/`) | — | — |
| `deploy/` | `.htaccess` de referência | — | — |

A raiz do repositório é só **orquestração** (`package.json`, `Makefile`, `docs/`). O código da bio vive em `bio/`.

---

## Comandos úteis (`make`)

| Comando | O que faz |
|---------|-----------|
| `make install` | Instala deps de bio, editor, panel e site |
| `make dev-all` | Sobe bio + editor + painel + landing |
| `make site` | Sobe só a landing (dev) |
| `make site-build` | Build da landing → `site/dist/` |
| `make platform-core` | Build da plataforma → `platform-release/` |
| `make update-package` | ZIP de update remoto (bump + changelog) |
| `make hash-password PASSWORD="..."` | Hash bcrypt para `auth.config.php` |
| `make lint` / `make clean` | Linter / limpa builds |

Apps avulsos no dia a dia: `npm run bio` · `npm run editor` · `npm run panel` · `npm run site`.

---

## Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · PHP (produção na HostGator) · MySQL (painel multi-cliente)
