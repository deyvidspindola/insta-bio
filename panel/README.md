# Painel da plataforma (`/panel/`)

Super-admin para cadastrar clientes e provisionar pastas `/{slug}/` na HostGator.

## Desenvolvimento local

```bash
# Na raiz do monorepo
make install
npm run build:template   # gera platform-template/_template/
npm run panel            # http://localhost:5175/panel/
```

Login dev padrão (criado automaticamente):

- **E-mail:** `admin@local.dev`
- **Senha:** `admin123`

Clientes criados em dev ficam em `panel/data/platform/{slug}/` e são acessíveis em `http://localhost:5175/{slug}/`.

Em desenvolvimento, o editor do cliente (`/{slug}/editor/`) é **proxy para o Vite na porta 5180** — você sempre vê o código atual sem rodar sync. A bio pública do cliente continua vindo da pasta estática do template (atualize com **Atualizar sites** ou `npm run sync:clients` quando mudar só a bio buildada).

### Problemas comuns no dev local

- **URL do painel:** use `http://localhost:5175/panel/` (com barra no final).
- **Porta em uso:** se `make dev-all` avisar que a porta está ocupada, encerre o terminal antigo ou rode `fuser -k 5175/tcp` (e 5173, 5180, 5190).
- **WSL + Windows:** se `localhost` não abrir no navegador do Windows, use o endereço **Network** que o Vite imprime (ex.: `http://172.x.x.x:5175/panel/`).

## Produção (HostGator)

### Observabilidade (Sentry)

No diretório `panel/`, instale o SDK:

```bash
composer install
# ou: composer require sentry/sentry
```

Depois, configure o `SENTRY_DSN` em `panel/php/db.config.php`.
Se `vendor/autoload.php` existir, o painel inicializa o Sentry no `bootstrap.php`.

**O que vai ao Sentry:** apenas erros graves (exceptions e fatals). Warnings PHP **não** são enviados. Exceções capturadas com `platform_capture_exception()` continuam sendo reportadas.

> Em hospedagem compartilhada, a extensão `excimer` normalmente não está disponível. O painel funciona sem ela; apenas profiling pode ficar indisponível.

> Se aparecer `Class "Sentry\Integration\IntegrationRegistry" not found`, o `vendor/` no servidor está incompleto — rode `composer install` em `panel/` e envie a pasta `vendor/` inteira via FTP.

### 1. Build

```bash
npm run build:platform
```

Saída: `platform-release/` — suba **todo o conteúdo** para `public_html/`.

### 2. MySQL

1. cPanel → **MySQL® Database Wizard** — criar banco e usuário
2. phpMyAdmin → executar `panel/schema.sql`
3. Gerar hash do seu admin:

```bash
npm run hash-password --prefix panel -- "SuaSenhaForte"
```

4. Inserir admin:

```sql
INSERT INTO platform_admins (email, password_hash)
VALUES ('seu@email.com', '$2b$...');
```

### 3. Config PHP

```bash
cp panel/php/db.config.example.php panel/php/db.config.php
```

Edite com host, banco, usuário, senha. O padrão grava clientes em **`panel/sites/`** (pasta gravável pelo PHP na HostGator). As URLs públicas continuam `/{slug}/` via `.htaccess` na raiz.

### 4. Permissões

O PHP precisa poder **criar pastas** em `panel/sites/`. Após o deploy, acesse `/panel/install` — a página informa se o provisionamento automático está OK.

Diagnóstico (logado no painel): `POST /panel/api/provision/check`

### Atualizar sites existentes

Depois de subir um `_template/` novo na raiz do domínio:

1. Acesse o painel → botão **Atualizar sites** (ícone de pastas sincronizadas no topo)
2. O PHP copia HTML, bundles JS/CSS, editor e arquivos de licença para **todos** os clientes
3. **Preservado:** `bio.json`, imagens em `assets/`, senha do editor (`auth.config.php`)

Equivalente em CLI (dev): `npm run sync:clients -- --platform-root panel/sites`

## Fluxo

1. Acesse `https://linksnabio.app.br/panel/`
2. **Novo cliente** → nome, slug, e-mail
3. Sistema copia `_template/` → `/{slug}/`, gera senha e `auth.config.php`
4. Envie credenciais ao cliente

## Documentação

- [PLATAFORMA.md](../docs/PLATAFORMA.md) — arquitetura completa
