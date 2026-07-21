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
make site          # só a landing
make dev-all       # landing + bio + editor + painel
```

**Demo do editor:** com `make dev-all` ou `make editor`, abra [http://localhost:5180/demo.html](http://localhost:5180/demo.html). Os CTAs da landing apontam para essa URL em desenvolvimento.

## Conteúdo e personalização

| Arquivo | O que mudar |
|---------|-------------|
| `site/src/template-home.html` | Textos, seções, FAQ, hero |
| `site/src/config.ts` | WhatsApp, `DEMO_URL`, Instagram |
| `editor/public/demo-bio.json` | Bio carregada no modo demonstração |

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
npm run site:build    # → site/dist/
```

Em produção na plataforma, a landing entra em `platform-release/` na raiz do domínio. Para demo do editor, inclua também `editor/dist/demo.html` e assets do editor (ver `npm run build:platform`).

## Documentação

- [README.md](../README.md) — visão geral do monorepo
- [MELHORIAS.md](../docs/MELHORIAS.md) — roadmap da landing
