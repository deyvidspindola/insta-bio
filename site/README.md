# Site comercial — links na bio

Landing page em **React**, usando o template NextSaaS renderizado a partir de `src/template-home.html`.

## Desenvolvimento

```bash
cd site
npm install
npm run dev    # http://localhost:5190
```

Na raiz do monorepo:

```bash
make site          # só a landing (dev)
make site-build    # build → site/dist/
make dev-all       # landing + bio + editor + painel
```

**Demonstração:** a landing não abre o editor público. Os CTAs “Agende uma demonstração” vão para o WhatsApp (`site/src/config.ts`).

## Conteúdo e personalização

| Arquivo | O que mudar |
|---------|-------------|
| `site/src/template-home.html` | Textos, seções, FAQ, hero |
| `site/src/config.ts` | WhatsApp, Instagram |

Scripts opcionais de conteúdo (one-off): `site/scripts/apply-landing-brief.py`, `optimize-landing.py`, `patch-content.py`.

## Assets

| Pasta | Uso |
|-------|-----|
| `site/public/images/` | Imagens da landing (previews do editor, features) |
| `site/public/logo-instabio.svg` | Logo do produto |
| `site/public/template/assets/` | CSS/JS compilados do NextSaaS |
| `site/public/template/vendor/` | GSAP, Swiper, etc. |
| `site/public/template/images/gradient/` | Fundos referenciados no CSS |
| `site/public/template/images/icons/` | Ícones do template |

## Build

```bash
make site-build       # → site/dist/
# ou: npm run site:build
```

Em produção na plataforma, a landing entra em `platform-release/` na raiz do domínio (`npm run build:platform`). O editor de demonstração público **não** é publicado.

## Documentação

- [README.md](../README.md) — visão geral do monorepo
- [MELHORIAS.md](../docs/MELHORIAS.md) — roadmap da landing
