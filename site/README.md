# Site comercial — insta-bio

Landing page baseada no template **NextSaaS** (`home-page-22.html`), renderizada em **React** com o HTML/CSS/JS originais do template.

## Desenvolvimento

```bash
npm install
npm run dev    # http://localhost:5190
```

Na raiz do monorepo:

```bash
make site
```

## Conteúdo e personalização

| Arquivo | O que mudar |
|---------|-------------|
| `src/template-home.html` | Textos, seções e links da landing (hero, editor, recursos, FAQ…) |
| `src/config.ts` | WhatsApp e Instagram (referência) |
| `scripts/patch-content.py` | Script usado para aplicar a copy comercial inicial |

Os CTAs principais apontam para WhatsApp (`5519999999999` — troque pelo seu número).

## Assets do template

Os arquivos estáticos ficam em `public/template/`:

- `assets/main.css` — estilos compilados do NextSaaS
- `assets/main.js` — animações e interações
- `vendor/` — GSAP, Swiper, Stack Cards, etc.
- `images/` — imagens do home-page-22

Logo do produto: `public/logo-instabio.svg`

## Build

```bash
npm run build    # gera site/dist/
```
