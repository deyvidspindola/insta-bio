# Plataforma multi-cliente — Links na Bio

Documento de arquitetura e plano de implementação do **super-admin** (`/panel/`) e provisionamento de clientes por pasta.

Última revisão: julho/2026.

---

## Decisões de produto (confirmadas)

| Tópico | Decisão |
|--------|---------|
| URL do cliente | `https://linksnabio.app.br/{slug}/` — **sem** prefixo `/c/` |
| Editor do cliente | `https://linksnabio.app.br/{slug}/editor/` |
| Landing comercial | Raiz: `https://linksnabio.app.br/` |
| Super-admin | `https://linksnabio.app.br/panel/` |
| Subdomínio por cliente | **Pacote premium (futuro)** — ex.: `igreja.linksnabio.app.br` |
| Provisionamento | Copiar pasta `_template/` no servidor (sem build na HostGator) |
| Login do cliente (editor) | **E-mail** como usuário + **senha aleatória** gerada no cadastro |
| Banco de dados | MySQL na HostGator (criar no cPanel quando for implementar) |
| Slug | Único, validado no cadastro e no filesystem |

---

## Estrutura no servidor (HostGator)

```
public_html/                          ← linksnabio.app.br
│
├── index.html                        ← landing (site/)
├── assets/ …                         ← assets da landing
│
├── panel/                            ← super-admin (React + PHP + MySQL)
│   ├── index.html
│   ├── api/ …                        ← endpoints PHP
│   └── …
│
├── _template/                        ← pacote base (NÃO é site público)
│   ├── index.html                    ← bio pública
│   ├── bio.json
│   ├── bio.default.json
│   ├── assets/
│   ├── .htaccess
│   └── editor/                       ← editor do cliente (admin/dist copiado)
│       ├── index.html
│       ├── login.php
│       └── …
│
├── igreja-expressar/                 ← cliente (cópia de _template/)
│   ├── index.html
│   ├── bio.json
│   ├── assets/
│   └── editor/
│
└── empresa-x/
    └── …
```

### Proteger `_template/`

A pasta modelo não pode ser acessível na web. Opções (escolher uma na implementação):

1. **Fora do `public_html`** — ex.: `~/template/` e o PHP copia de lá (melhor).
2. **Dentro do `public_html`** com `.htaccess` bloqueando tudo:

```apache
# _template/.htaccess
Require all denied
```

---

## URLs reservadas (slug proibido)

O slug do cliente **não pode** colidir com rotas do sistema nem com pastas da landing.

Lista inicial de slugs reservados:

```
panel
editor
api
assets
_template
template
admin
www
mail
ftp
cdn
static
public
release
precos
pricing
login
signup
cadastro
contato
sobre
blog
docs
status
health
```

Na implementação: validar no PHP **e** no MySQL (`UNIQUE` em `slug`). Antes de copiar a pasta, checar se o diretório já existe no disco.

### Regras do slug

| Regra | Valor |
|-------|--------|
| Caracteres | `a-z`, `0-9`, hífen |
| Tamanho | 3–40 caracteres |
| Início/fim | Não pode começar ou terminar com hífen |
| Unicidade | Único no banco + pasta inexistente |
| Normalização | Minúsculas, sem acentos (ex.: `igreja-expressar`) |

---

## Fluxo: criar cliente (Fase 1)

```
Você loga em /panel/
        ↓
Preenche: nome, slug, e-mail
        ↓
PHP valida slug (regras + reservados + UNIQUE)
        ↓
Gera senha aleatória (ex.: 12 chars)
        ↓
INSERT no MySQL (clients)
        ↓
Copia _template/ → public_html/{slug}/
        ↓
Grava bio.json inicial (nome do cliente, modelo padrão)
        ↓
Grava editor/auth.config.php (e-mail + hash bcrypt da senha)
        ↓
Retorna credenciais para você enviar ao cliente
```

### Suspender / excluir (Fase 1 ou 1.1)

| Ação | Comportamento sugerido |
|------|------------------------|
| **Suspender** | Flag `status = suspended` no DB; `.htaccess` ou `index.php` na pasta exibe “indisponível” |
| **Excluir** | Confirmação dupla; remove pasta + registro no DB (ou soft-delete) |

---

## Banco de dados (MySQL) — schema inicial

Criar no cPanel → **MySQL® Database Wizard** quando for implementar.

### Tabela `clients`

```sql
CREATE TABLE clients (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(40) NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL COMMENT 'hash bcrypt usado no login do editor',
  password_enc  VARCHAR(255) NULL COMMENT 'senha cifrada (AES-256-CBC) para consulta',
  status        ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_email (email)
);
```

> **Senha do cliente:** o login do editor usa `password_hash` (bcrypt, irreversível).
> Para permitir **consultar** a senha depois (o cliente esqueceu e ainda não há
> autoatendimento), também guardamos `password_enc` — a senha cifrada com AES-256-CBC
> usando a chave `APP_SECRET` (definida em `db.config.php`). Nunca fica em texto puro no
> banco; o painel decifra só quando o admin clica em "ver senha". Também há **redefinir
> senha** (gera uma nova, regrava o `auth.config.php` do editor e o `password_enc`).
>
> Se a tabela já existir sem a coluna:
> `ALTER TABLE clients ADD COLUMN password_enc VARCHAR(255) NULL AFTER password_hash;`

### Tabela `platform_admins` (super-admin — só você por enquanto)

```sql
CREATE TABLE platform_admins (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Fase 2 (self-service) — campos futuros em `clients`

- `plan` (`free`, `pro`, `premium`)
- `email_verified_at`
- `subdomain` (nullable — premium)
- `stripe_customer_id` ou similar

Não implementar agora; só deixar o schema extensível.

---

## Ajuste técnico crítico: `basePath` em runtime

Hoje o caminho público (`/insta-bio/`) é **fixado no build**. Para um único `_template/` servir qualquer cliente em `/{slug}/`, o código precisa detectar o prefixo em **runtime**.

### Estratégia proposta

1. Ler `window.location.pathname`.
2. Se estiver em `/{slug}/` ou `/{slug}/editor/`, extrair `/{slug}/` como `publicBase`.
3. Se estiver na landing (`/`, `/precos`, …), usar `/`.
4. `resolvePublicUrl()` e `bioJsonUrl()` usam esse valor.

Isso permite **um build de template** copiado para N pastas sem rebuild por cliente.

### `config.json` por cliente (opcional, complementar)

Arquivo gerado no provisionamento:

```json
{
  "slug": "igreja-expressar",
  "basePath": "/igreja-expressar/"
}
```

Útil se a detecção automática falhar em algum edge case; o PHP grava na cópia.

---

## Monorepo — organização prevista

```
insta-bio/
├── site/              ← landing (raiz do domínio)
├── admin/             ← editor do cliente (vai dentro de cada {slug}/editor/)
├── panel/             ← NOVO: super-admin (/panel/)
├── scripts/
│   ├── package-deploy.mjs      ← deploy single-tenant (atual)
│   └── package-template.mjs    ← NOVO: gera _template/ para a plataforma
└── docs/
    └── PLATAFORMA.md           ← este arquivo
```

| App | URL em produção | Quem usa |
|-----|-----------------|----------|
| `site/` | `/` | Visitantes, marketing |
| `panel/` | `/panel/` | Você (operador da plataforma) |
| `admin/` | `/{slug}/editor/` | Cliente final |
| bio pública | `/{slug}/` | Seguidores do Instagram |

---

## Super-admin em subdomínio (opcional)

Além de `/panel/`, dá para usar **`panel.linksnabio.app.br`** apontando para a mesma pasta `panel/`.

### Passos no Registro.br + HostGator

1. **cPanel → Subdomínios**
   - Subdomínio: `panel`
   - Domínio: `linksnabio.app.br`
   - Document root: `public_html/panel` (mesma pasta do `/panel/`)

2. **DNS** — na HostGator com domínio no mesmo cPanel, o subdomínio costuma ser criado **automaticamente** (registro A/CNAME). Não precisa editar DNS manualmente na maioria dos casos.

3. **SSL** — cPanel → **SSL/TLS Status** → **Run AutoSSL** para incluir `panel.linksnabio.app.br`.

4. **Redirecionar** (opcional): `linksnabio.app.br/panel` → `panel.linksnabio.app.br` via `.htaccess`.

### Subdomínio por cliente (premium — futuro)

Cada novo cliente exigiria:

1. cPanel → Subdomínios → `igreja` → document root `public_html/igreja-expressar` **ou** symlink
2. AutoSSL para o novo host

Por isso fica como **pacote premium** (você configura manualmente ou automatiza depois com API do cPanel, se disponível no plano).

---

## Fase 1 — MVP operacional ✅ (implementado)

| # | Entrega | Status |
|---|---------|--------|
| 1 | `basePath` em runtime (bio + editor) | ✅ `src/lib/publicUrl.ts` |
| 2 | Script `package-template.mjs` → `_template/` | ✅ `npm run build:template` |
| 3 | App `panel/` — login super-admin | ✅ `/panel/` |
| 4 | CRUD clientes: criar, listar, credenciais | ✅ |
| 5 | API PHP: slug, copiar template, auth + bio | ✅ |
| 6 | MySQL: schema `clients` + `platform_admins` | ✅ `panel/schema.sql` |
| 7 | Slugs reservados | ✅ `src/lib/reservedSlugs.ts` |
| 8 | Build plataforma | ✅ `npm run build:platform` → `platform-release/` |

### Comandos

```bash
make install
npm run build:platform    # gera platform-release/
npm run panel             # dev → localhost:5175/panel/
```

Ver [panel/README.md](../panel/README.md) para deploy na HostGator.

---

## Fase 1 (original — referência)

| # | Entrega |
|---|---------|
| 1 | `basePath` em runtime (bio + editor) |
| 2 | Script `package-template.mjs` → pasta `_template/` |
| 3 | App `panel/` — login super-admin |
| 4 | CRUD clientes: criar, listar, ver credenciais |
| 5 | API PHP: validar slug, copiar template, gerar `auth.config.php` + `bio.json` |
| 6 | MySQL: tabelas `clients` + `platform_admins` |
| 7 | Lista de slugs reservados |
| 8 | Documentar deploy da plataforma em [HOSTGATOR.md](./HOSTGATOR.md) |

### Fase 1.1 — Operação

- Suspender / reativar cliente
- Excluir cliente (com confirmação)
- Botão “copiar link da bio” e “abrir editor”
- Log de provisionamento (opcional)

### Fase 2 — Self-service

- Cadastro público (`/cadastro`)
- Verificação de e-mail
- Cliente entra e configura sozinho
- Planos (free / pro / premium com subdomínio)

---

## Deploy da plataforma (visão geral)

Build local (seu computador):

```bash
npm run build:platform   # (a criar) — landing + panel + _template
```

Upload FTP para `public_html/`:

- Conteúdo da landing na raiz
- `panel/` completo
- `_template/` (ou fora do public_html)
- **Não** subir pastas de clientes manualmente — o `/panel/` cria via PHP

Atualizar o template: novo build → substituir `_template/` → clientes antigos **não** mudam automaticamente (atualização por cliente ou script de migração futuro).

---

## Segurança (mínimo)

| Item | Medida |
|------|--------|
| Super-admin | Sessão PHP, senha bcrypt, HTTPS obrigatório |
| Editor do cliente | Isolado por pasta; `auth.config.php` por tenant |
| Cópia de pastas | Só via API autenticada do `/panel/` |
| Slug | Whitelist regex; bloquear `..`, path traversal |
| `_template/` | Inacessível via web |
| Senha gerada | Exibir uma vez no cadastro; armazenar só hash |

---

## Referências

- [PROJETO.md](./PROJETO.md) — arquitetura atual
- [HOSTGATOR.md](./HOSTGATOR.md) — deploy single-tenant (base)
- [ADMIN.md](./ADMIN.md) — editor do cliente
- [MELHORIAS.md](./MELHORIAS.md) — roadmap geral
- [COMERCIALIZACAO.md](./COMERCIALIZACAO.md) — modelo de venda (atualizar quando plataforma existir)
