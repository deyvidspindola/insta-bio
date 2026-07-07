# Site comercial — links na bio

Landing page baseada no template **NextSaaS** (`home-page-22.html`), renderizada em **React** com o HTML/CSS/JS originais do template.

## Desenvolvimento

```bash
npm install
npm run dev    # http://localhost:5190
```

Na raiz do monorepo:

```bash
make site          # só a landing
make dev-all       # landing + editor + demo + bio + painel
```

**Editor de demonstração:** com o admin rodando (`make admin` ou `make dev-all`), abra [http://localhost:5180/demo.html](http://localhost:5180/demo.html). Os botões *Experimentar o editor* na landing abrem essa URL automaticamente em dev.

## Conteúdo e personalização

| Arquivo | O que mudar |
|---------|-------------|
| `src/template-home.html` | Textos, seções e links da landing (hero, editor, recursos, FAQ…) |
| `src/config.ts` | WhatsApp, URL do demo (`DEMO_URL`) e Instagram |
| `admin/public/demo-bio.json` | Bio de exemplo carregada no modo demonstração |

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

Em produção, copie também `admin/dist/demo.html` e a pasta `admin/dist/assets/` para o mesmo domínio da landing (ex.: `public_html/demo.html`), para o link `/demo.html` funcionar.
