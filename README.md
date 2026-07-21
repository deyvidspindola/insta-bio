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

**Login local do editor:** `admin` / `troque-esta-senha` (arquivo `editor/auth.json`).

**Demo do editor:** [http://localhost:5180/demo.html](http://localhost:5180/demo.html)

---

## Publicar na HostGator

Hospedagem compartilhada **sem Node** — o editor usa **PHP** para login, salvar e upload.

```bash
npm run build                  # gera dist/ na raiz (bio pública)
npm run editor:hostgator       # gera editor/dist/ (editor + PHP)
# ou pacote único:
make package
```

**Guia completo:** [docs/HOSTGATOR.md](./docs/HOSTGATOR.md)

**O que subir após o build:** [docs/DEPLOY-ATUALIZACAO.md](./docs/DEPLOY-ATUALIZACAO.md)

**Vender / instalar para clientes:** [docs/COMERCIALIZACAO.md](./docs/COMERCIALIZACAO.md)

**Plataforma multi-cliente:** [docs/PLATAFORMA.md](./docs/PLATAFORMA.md)

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

## Comandos úteis

| Comando | O que faz |
|---------|-----------|
| `make install` | Instala deps de bio, editor, panel e site |
| `make dev-all` | Sobe os quatro apps de desenvolvimento |
| `npm run dev` / `npm run bio` | Bio local (porta 5173) |
| `npm run build` | Build da bio → `dist/` |
| `npm run preview` | Testa o `dist/` localmente |
| `npm run editor` | Editor local (porta 5180) |
| `npm run editor:hostgator` | Build do editor + PHP |
| `make package` | Pacote unificado em `release/` |
| `npm run build:platform` | Plataforma → `platform-release/` |
| `npm run build:template` | Template de cliente → `platform-template/_template/` |
| `npm run sync:clients` | Atualiza sites locais a partir do template |
| `npm run build:update-package` | Gera `dist/updates/insta-bio-{VERSION}.zip` + `updates.json` |
| `make update-package` | Atalho para o comando acima |
| `make hash-password PASSWORD="..."` | Hash bcrypt para `auth.config.php` |
| `make clean` | Remove pastas de build |

**Aliases legados:** `npm run admin` = `npm run editor`, `make admin` = `make editor`.

---

## Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · PHP (produção na HostGator) · MySQL (painel multi-cliente)
