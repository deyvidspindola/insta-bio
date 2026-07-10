# Editor visual

Painel para editar o `bio.json` pela tela, com preview ao vivo, rascunho/publicação e login.

---

## Uso local

```bash
npm run editor       # http://localhost:5180
make dev-all         # bio + editor + panel + site
```

**Login dev:** copie `editor/auth.example.json` → `editor/auth.json` (usuário `admin`).

**Demo:** [http://localhost:5180/demo.html](http://localhost:5180/demo.html) — bio de exemplo em `editor/public/demo-bio.json`.

---

## Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Marca** | Nome, logo, redes sociais, cores, SEO, rodapé |
| **Seções** | Criar, editar, excluir, reordenar (arrastar) |
| **Cards** | WhatsApp hero, feature, link, vídeo, produtos, slides, Spotify, YouTube, localização |
| **Preview ao vivo** | Iframe com a mesma resolução de URLs da bio pública |
| **Upload** | Imagens e vídeos → pasta `assets/` ao lado do `bio.json` |
| **Salvar** | Grava rascunho (`bio.draft.json`) — não altera a bio pública |
| **Publicar** | Copia rascunho para `bio.json` (bio ao vivo) |
| **Reverter** | Configurações → descarta rascunho e volta ao publicado |
| **Caminho do bio.json** | Configurações → pasta customizada (ex.: `painel/bio.json`) |
| **Importar / exportar** | JSON completo |
| **Tema** | Modo escuro/claro no editor |

### Variantes do card `feature`

| Variante | Uso |
|----------|-----|
| `gradient` | Card colorido com ícone |
| `square` | Quadrado (layout `grid-2`) |
| `compact` | Horizontal estilo YouTube |
| `portrait` | Retrato com imagem |
| `banner` | Banner largo |

---

## Fluxo de trabalho

### Produção (HostGator)

1. `https://seudominio.com/editor/` → login
2. Editar marca e seções
3. **Salvar** → rascunho
4. **Publicar** → bio pública atualizada
5. Conferir em `https://seudominio.com/`

### Desenvolvimento local

1. `npm run editor` + `npm run dev` (bio em outro terminal, ou `make dev-all`)
2. Editar e **Salvar** / **Publicar**
3. Arquivos em `bio/public/bio.json` e `bio/public/assets/`
4. A bio em `:5173` reflete o **publicado**, não só o rascunho

---

## Deploy na HostGator

→ [HOSTGATOR.md](./HOSTGATOR.md)

```bash
make hash-password PASSWORD="sua-senha"
cp editor/php/auth.config.example.php editor/php/auth.config.php
npm run editor:hostgator
```

Subir `editor/dist/` → `public_html/editor/` e `dist/` → raiz.

---

## Clientes da plataforma (login remoto)

Clientes provisionados pelo `/panel/` usam:

- `editor/platform-api.json` — URL da API de login no painel
- `editor/platform-auth.php` — autenticação remota
- Credenciais geradas no cadastro do cliente

Não dependem de `AUTH_PASSWORD_HASH` local (exceto fallback).

---

## Segurança

| Ambiente | Credenciais |
|----------|-------------|
| Dev (`npm run editor`) | `editor/auth.json` |
| HostGator single-tenant | `editor/auth.config.php` |
| Plataforma | API do painel + licença |

- Login validado no servidor (Node em dev, PHP em produção)
- Senha nunca vai no JS nem no `bio.json` público
- Use HTTPS em produção

---

## Estrutura

```
editor/
├── src/                    # React (EditorApp, formulários, preview)
├── php/                    # API produção
│   ├── login.php
│   ├── save.php / publish.php / revert.php
│   ├── upload.php
│   ├── editor-paths.php    # caminho do bio.json
│   ├── bio-path.php
│   ├── platform-auth.php
│   └── auth.config.example.php
├── server/                 # API Node (só dev)
├── public/                 # demo-bio.json, ícones
├── scripts/                # build-hostgator, hash-password
└── dist/                   # build para upload (gerado)
```

O editor reutiliza componentes da bio via `@site` → `bio/src/`.

---

## Documentos relacionados

- [HOSTGATOR.md](./HOSTGATOR.md)
- [COMERCIALIZACAO.md](./COMERCIALIZACAO.md)
- [BIO-JSON.md](./BIO-JSON.md)
- [PROJETO.md](./PROJETO.md)
