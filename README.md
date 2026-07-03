# insta-bio

Template de **link da bio** para Instagram — inspirado no [Voe Connect](https://voeconnect.com.br/bio).

O conteúdo da página fica em **`bio.json`**. Depois do deploy inicial, dá para atualizar textos e links **sem rebuild** — pelo editor online ou trocando o arquivo no servidor.

---

## Início rápido (desenvolvimento)

```bash
npm install
npm install --prefix admin

npm run dev          # Site (bio demo) → http://localhost:5173
npm run admin        # Editor → http://localhost:5180
npm run site         # Landing comercial → http://localhost:5190
```

Login local do editor: `admin` / `troque-esta-senha` (arquivo `admin/auth.json`).

---

## Publicar na HostGator

Hospedagem compartilhada **sem Node** — o editor usa **PHP** para login, salvar e upload.

```bash
npm run build                  # gera dist/ (site)
npm run admin:hostgator        # gera admin/dist/ (editor + PHP)
```

**Guia completo:** [docs/HOSTGATOR.md](./docs/HOSTGATOR.md)

**Vender / instalar para clientes:** [docs/COMERCIALIZACAO.md](./docs/COMERCIALIZACAO.md)

---

## Documentação

| Documento | Para quem | Conteúdo |
|-----------|-----------|----------|
| [HOSTGATOR.md](./docs/HOSTGATOR.md) | Você, no deploy | Passo a passo FTP, login PHP, testes |
| [COMERCIALIZACAO.md](./docs/COMERCIALIZACAO.md) | Você, no negócio | Novo cliente, checklist, manutenção |
| [ADMIN.md](./docs/ADMIN.md) | Editor | Funcionalidades do painel |
| [BIO-JSON.md](./docs/BIO-JSON.md) | Conteúdo | Campos, cards, ícones, exemplos |
| [PROJETO.md](./docs/PROJETO.md) | Desenvolvedor | Arquitetura e código |
| [MELHORIAS.md](./docs/MELHORIAS.md) | Produto / negócio | Roadmap, gaps e prioridades |
| [site/README.md](./site/README.md) | Comercial | Landing page de vendas |

---

## Projetos no repositório

| Pasta | O que é | Porta dev |
|-------|---------|-----------|
| `/` (raiz) | Bio demo (produto) | 5173 |
| `admin/` | Editor online | 5180 |
| `site/` | Site comercial / vendas | 5190 |

---

## Comandos úteis

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Site local (porta 5173) |
| `npm run build` | Build do site → `dist/` |
| `npm run preview` | Testa o `dist/` localmente |
| `npm run admin` | Editor local com Node (porta 5180) |
| `npm run admin:hostgator` | Build do editor + PHP para HostGator |
| `npm run hash-password --prefix admin -- "senha"` | Gera hash para `auth.config.php` |

---

## Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · PHP (produção na HostGator)
