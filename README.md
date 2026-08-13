# Links na Bio (V2)

SaaS de link na bio: o visitante vê a página pública; o dono cria a conta, escolhe um layout e edita os links. PHP (Laravel) no servidor, React no front. Hospedagem compartilhada (HostGator).

## Início rápido (Docker)

```bash
make up
```

`make help` lista os atalhos (`down`, `logs`, `test`, `artisan`, …).

- Landing: http://localhost:8000
- Cadastro: http://localhost:8000/cadastro
- Editor (após onboarding): http://localhost:8000/app
- E-mails (Mailpit): http://localhost:8025

Seed: `admin@local.dev` / `admin123` (admin). Na primeira subida o container instala dependências, gera a `APP_KEY`, migra e popula o banco. E-mails de verificação vão para o Mailpit, não para a caixa real.

## Início rápido (sem Docker)

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
composer run dev
```

## Arquitetura PHP

Controllers **não** acessam o banco e **não** têm regra de negócio: validam o HTTP (Form Request) e chamam um use case `execute()`.

```
app/Http/Controllers/   → orquestra Request → UseCase → Response
app/UseCases/           → uma classe por funcionalidade, método execute()
app/Services/           → lógica reutilizável (plano, slug, Mercado Pago, DNS…)
app/Repositories/       → único acesso Eloquent
app/Exceptions/         → ApplicationException (JSON 4xx ou redirect com erros)
```

Rotas separadas:

| Arquivo | Conteúdo |
|---------|----------|
| `routes/web.php` | Landing, auth, SPA (onboarding, editor, settings) |
| `routes/bio.php` | API da bio, mídia, billing, domínio, analytics, bio pública |
| `routes/admin.php` | Painel e API admin |

O schema da bio está em `resources/js/bio/types/bio.ts` e o JSON default em `database/data/bio.default.json`.

## Front (React)

O editor e a bio pública mantêm o visual da V1. O app de auth/onboarding/settings e o admin seguem a mesma ideia: páginas curtas, hooks com a lógica, componentes reutilizáveis em `resources/js/shared/ui`.

## Deploy

Push em `main` (homologação) ou `production` (produção, com aprovação). O GitHub Actions builda os assets e chama `bin/deploy.sh` no servidor.

Secrets por environment (`staging` / `production`): `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_PORT`, `SSH_KNOWN_HOSTS`, `SSH_USER`, `APP_PATH`. Variável: `APP_URL`.

Atalho para gerar chave e checklist:

```bash
./bin/setup-github-deploy-secrets.sh staging
./bin/setup-github-deploy-secrets.sh production
```
