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

## Produção (HostGator)

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

Edite com host, banco, usuário, senha. Confirme que `PLATFORM_ROOT` aponta para `public_html` (padrão: dois níveis acima de `panel/php/`).

Copie `db.config.php` para `panel/dist/` antes do upload **ou** edite direto no servidor em `public_html/panel/db.config.php`.

### 4. Permissões

O PHP precisa poder **criar pastas** em `public_html/` (cópia do `_template/`). Permissão típica: `755` no `public_html`.

## Fluxo

1. Acesse `https://linksnabio.app.br/panel/`
2. **Novo cliente** → nome, slug, e-mail
3. Sistema copia `_template/` → `/{slug}/`, gera senha e `auth.config.php`
4. Envie credenciais ao cliente

## Documentação

- [PLATAFORMA.md](../docs/PLATAFORMA.md) — arquitetura completa
