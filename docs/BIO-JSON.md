# Referência do `bio.json`

Este arquivo descreve tudo o que pode ser configurado em `bio/public/bio.json` **sem precisar rebuildar** o projeto (após o deploy inicial).

> **Modelo padrão:** `bio/public/bio.default.json` é o template comercial do produto (bio do próprio insta-bio). Use como ponto de partida para novos clientes ou restaure pelo editor (**Restaurar modelo padrão**).

> Após editar o JSON em produção, basta recarregar a página. Se a mudança não aparecer, force refresh (`Ctrl+F5`).

---

## Estrutura geral

```json
{
  "brand": { ... },
  "sections": [ ... ]
}
```

| Chave | Obrigatório | Descrição |
|-------|-------------|-----------|
| `brand` | Sim | Identidade visual, SEO e informações do topo da página |
| `sections` | Sim | Lista de seções com cards e links |

---

## `brand` — identidade da página

```json
{
  "brand": {
    "name": "Igreja Expressar",
    "tagline": "Revelar Cristo em todas as áreas da vida",
    "location": "Paulínia · SP",
    "instagram": {
      "handle": "@igrejaexpressar",
      "url": "https://www.instagram.com/igrejaexpressar"
    },
    "logo": "assets/logo-expressar.jpeg",
    "coverImage": "assets/capa.jpg",
    "theme": {
      "primary": "oklch(0.72 0.16 55)",
      "glow": "oklch(0.70 0.18 55 / 0.28)"
    },
    "seo": {
      "title": "Igreja Expressar · Link da Bio",
      "description": "Texto para Google e compartilhamento no WhatsApp"
    },
    "footer": "© 2026 Igreja Expressar · Paulínia"
  }
}
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | Sim | Nome exibido no topo |
| `tagline` | string | Não | Frase abaixo do nome |
| `location` | string | Sim | Cidade/região (ex: `Paulínia · SP`) |
| `instagram.handle` | string | Sim | @ exibido no botão |
| `instagram.url` | string | Sim | Link do perfil |
| `logo` | string | Sim | Caminho da imagem do logo |
| `coverImage` | string | Não | Banner horizontal no topo (use só se fizer sentido) |
| `theme.primary` | string | Sim | Cor principal (CSS: hex, rgb, oklch…) |
| `theme.glow` | string | Não | Cor do brilho de fundo no topo |
| `seo.title` | string | Sim | Título da aba do navegador |
| `seo.description` | string | Sim | Meta description |
| `footer` | string | Sim | Texto do rodapé |

### Imagens do `brand`

Coloque arquivos em `bio/public/assets/` (dev) ou `assets/` na raiz do site (produção) e referencie no JSON com caminho **relativo**:

```json
"logo": "assets/meu-logo.png"
```

Formatos recomendados: `.jpg`, `.jpeg`, `.png`, `.webp`.

Se o `bio.json` estiver em subpasta (ex.: `painel/bio.json`), use caminhos relativos a essa pasta: `assets/logo.png` → `painel/assets/logo.png` no servidor.

---

## `sections` — blocos da página

Cada seção agrupa cards relacionados.

```json
{
  "id": "eventos",
  "title": "Eventos",
  "subtitle": "Inscrições abertas",
  "layout": "grid-2",
  "items": [ ... ]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | Sim | Identificador único (uso interno) |
| `title` | string | Sim | Título da seção. Use `""` para ocultar |
| `subtitle` | string | Não | Texto menor abaixo do título |
| `layout` | string | Não | Como os itens são dispostos (ver abaixo) |
| `items` | array | Sim | Lista de cards |

### Valores de `layout`

| Valor | Comportamento |
|-------|---------------|
| *(omitido)* ou `"stack"` | Cards empilhados, um abaixo do outro |
| `"grid-2"` | Grade com 2 colunas (ideal para eventos e grupos) |
| `"instagram-grid"` | **Ainda não implementado** — reservado para cards de ministérios |

---

## Tipos de card (`items`)

Todo card precisa do campo `"type"`. Os tipos disponíveis hoje:

| `type` | Uso típico |
|--------|------------|
| `whatsapp-hero` | **Legado** — use `app-hero` com `preset: "whatsapp"` |
| `app-hero` | Destaque padronizado por app (WhatsApp, YouTube, Instagram, Formulário, Telegram, Personalizado) |
| `feature` | Card de destaque (gradiente, quadrado, compacto, retrato, banner) |
| `link` | Card simples com ícone, título e subtítulo |
| `location` | Endereço com link para o mapa |
| `grid` | **Legado** — use `feature` com `variant: "square"` |

### Campo comum: `schedule` (agendamento)

Opcional em **qualquer** card. Controla quando o item aparece na **bio pública**. No editor e no preview, o card continua listado para edição.

```json
{
  "type": "link",
  "title": "Campanha de páscoa",
  "url": "https://exemplo.com/pascoa",
  "schedule": {
    "from": "2026-04-01T08:00:00-03:00",
    "until": "2026-04-20T23:59:00-03:00"
  }
}
```

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `schedule` | Não | Objeto de agendamento. Omitir = sempre visível |
| `schedule.from` | Não | ISO datetime — início da exibição |
| `schedule.until` | Não | ISO datetime — fim da exibição (instante exclusivo) |

**Timezone:** `America/Sao_Paulo`. Prefira gravar com offset (`-03:00`). Strings sem offset são interpretadas nesse fuso.

**Regras na bio pública:**

| Preenchimento | Comportamento |
|---------------|---------------|
| Sem `schedule` | Sempre visível |
| Só `from` | Visível a partir de `from` (permanece até remover o card ou definir `until`) |
| Só `until` | Visível até `until` |
| `from` + `until` | Visível enquanto `from <= agora < until` |

No editor: ative **Agendar exibição** no card para editar data/hora de início e fim.

---

### `app-hero`

Card de destaque com visual pronto por app. O cliente escolhe o preset no editor e só edita textos e link.

```json
{
  "type": "app-hero",
  "preset": "youtube",
  "badge": "Canal",
  "title": "Assista nossos vídeos",
  "description": "Lives, pregações e conteúdos exclusivos no YouTube.",
  "cta": "Ver canal",
  "url": "https://youtube.com/@canal"
}
```

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `preset` | Sim | `whatsapp`, `youtube`, `instagram`, `form`, `telegram`, `custom` |
| `badge`, `title`, `description`, `cta`, `url` | Sim | Textos e link do card |
| `icon` | Não | Só para `preset: "custom"` — ícone do card |

Presets disponíveis: **WhatsApp** (verde), **YouTube** (vermelho), **Instagram** (gradiente), **Formulário** (azul), **Telegram** (azul claro), **Personalizado** (cor da marca).

---

### `whatsapp-hero`

Card de destaque no estilo WhatsApp, com animação.

```json
{
  "type": "whatsapp-hero",
  "badge": "Comunidade oficial",
  "title": "Comunidade Expressar",
  "description": "Entre no nosso grupo principal...",
  "cta": "Entrar agora",
  "url": "https://chat.whatsapp.com/..."
}
```

| Campo | Obrigatório |
|-------|-------------|
| `badge`, `title`, `description`, `cta`, `url` | Sim |

---

### `feature`

Card de destaque com quatro variantes visuais.

```json
{
  "type": "feature",
  "badge": "Portal",
  "title": "Central de solicitações",
  "description": "Atendimento pastoral, casamento...",
  "cta": "Acessar portal",
  "url": "https://...",
  "variant": "gradient",
  "icon": "form"
}
```

#### Variantes (`variant`)

| Valor | Visual | Requer `image` |
|-------|--------|----------------|
| `gradient` | Card colorido com ícone (padrão) | Não |
| `square` | Card quadrado (grade 2 colunas) | Não |
| `compact` | Estilo YouTube / horizontal compacto | Não |
| `portrait` | Card alto com foto — estilo Ministério Criativo | Sim |
| `banner` | Card largo com foto — estilo Kids/Voluntários | Sim |

Use `"layout": "grid-2"` na seção para exibir cards `square` lado a lado.

#### Card quadrado (`square`) — eventos e grupos

```json
{
  "type": "feature",
  "variant": "square",
  "badge": "Novos membros",
  "title": "Café de Novos Membros",
  "description": "Inscrições abertas",
  "url": "https://...",
  "image": "assets/cafe.jpg",
  "gradient": "linear-gradient(135deg, oklch(0.70 0.18 55) 0%, oklch(0.55 0.19 40) 100%)"
}
```

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `title`, `url` | Sim | |
| `badge`, `description` | Não | `description` aparece como subtítulo no card |
| `image` | Não | Foto de fundo. Se presente, substitui o gradiente |
| `gradient` | Não | Fundo colorido quando não há `image` |

#### Card retrato (`portrait`) — estilo Ministério Criativo

```json
{
  "type": "feature",
  "variant": "portrait",
  "badge": "Inscrições abertas",
  "title": "Faça parte do Ministério Criativo",
  "description": "Audiovisual, design, comunicação",
  "url": "https://...",
  "image": "assets/ministerio-criativo.jpg"
}
```

#### Card banner (`banner`) — estilo Kids / Voluntários

```json
{
  "type": "feature",
  "variant": "banner",
  "badge": "Inscrições abertas · Voluntários",
  "title": "Venha servir no Kids ou no High",
  "description": "Faça parte do time que cuida das crianças e adolescentes.",
  "cta": "Inscrever-se",
  "url": "https://...",
  "image": "assets/kids-voluntarios.jpg",
  "tags": [
    { "label": "Kids", "icon": "baby" },
    { "label": "High", "icon": "zap" }
  ]
}
```

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `title`, `description`, `url` | Sim* | |
| `badge` | Não | Etiqueta superior |
| `cta` | Não | Botão de ação (visível no `banner` e `gradient`) |
| `variant` | Não | `"gradient"` (padrão), `"square"`, `"compact"`, `"portrait"` ou `"banner"` |
| `icon` | Não | Ícone (`gradient` e `compact`) |
| `image` | Sim** | Foto de fundo (`portrait`, `banner`; opcional em `square`) |
| `gradient` | Não | Cor de fundo (`gradient` e `square` sem imagem) |
| `tags` | Não | Múltiplas etiquetas no canto (`banner`, `portrait`) |

\* `description` é opcional para `square`.  
\*\* Obrigatório para `portrait` e `banner` renderizarem com foto.

---

### `link`

Card simples para links rápidos.

```json
{
  "type": "link",
  "title": "Agenda Expressar",
  "subtitle": "Cultos, eventos e programações",
  "url": "https://calendar.google.com/...",
  "icon": "calendar"
}
```

| Campo | Obrigatório |
|-------|-------------|
| `title`, `url` | Sim |
| `subtitle`, `icon` | Não |

---

### `grid` (legado)

> Prefira `feature` com `"variant": "square"`. O tipo `grid` ainda é renderizado para JSONs antigos.

```json
{
  "type": "grid",
  "badge": "Novos membros",
  "title": "Café de Novos Membros",
  "subtitle": "Inscrições abertas",
  "url": "https://...",
  "image": "assets/cafe.jpg",
  "gradient": "linear-gradient(...)"
}
```

Equivalente moderno: `type: "feature"`, `variant: "square"`, `description` no lugar de `subtitle`.

---

### `location`

Card de endereço com link para mapa.

```json
{
  "type": "location",
  "title": "Igreja Expressar",
  "address": "Av. Nelson Cardoso, 299 · Paulínia, SP",
  "mapUrl": "https://maps.google.com/?q=Av.+Nelson+Cardoso,+299,+Paulínia,+SP"
}
```

| Campo | Obrigatório |
|-------|-------------|
| `title`, `address`, `mapUrl` | Sim |

---

## Ícones disponíveis (`icon`)

Use exatamente um destes valores no campo `icon`:

| Valor | Uso sugerido |
|-------|--------------|
| `whatsapp` | WhatsApp |
| `compass` | Jornada / direção |
| `droplets` | Batismo |
| `map-pin` | Localização |
| `heart` | Membro, amor, pastoral |
| `gift` | Ofertas |
| `hand-heart` | Voluntariado |
| `sparkles` | Devocional, mulheres |
| `zap` | Adolescentes / energia |
| `baby` | Infantil |
| `users` | Grupos, comunidade |
| `calendar` | Agenda |
| `form` | Formulários, portal |
| `youtube` | YouTube |
| `pray` | Oração |
| `coffee` | Café, encontros |
| `message` | Mensagens |

Se omitir o `icon`, um ícone padrão é usado conforme o tipo de card.

---

## Exemplos de seções completas

### Hero com WhatsApp (sem título de seção)

```json
{
  "id": "hero",
  "title": "",
  "items": [
    {
      "type": "whatsapp-hero",
      "badge": "Comunidade oficial",
      "title": "Comunidade Expressar",
      "description": "Entre no nosso grupo principal.",
      "cta": "Entrar agora",
      "url": "https://chat.whatsapp.com/..."
    }
  ]
}
```

### Links empilhados

```json
{
  "id": "links",
  "title": "Fique por dentro",
  "items": [
    {
      "type": "link",
      "title": "Quero ser membro",
      "subtitle": "Faça parte da nossa família",
      "url": "https://chat.whatsapp.com/...",
      "icon": "heart"
    }
  ]
}
```

### Eventos em grade 2×2

```json
{
  "id": "eventos",
  "title": "Eventos",
  "layout": "grid-2",
  "items": [
    {
      "type": "feature",
      "variant": "square",
      "badge": "Novos membros",
      "title": "Café de Novos Membros",
      "url": "https://...",
      "image": "assets/cafe.jpg"
    },
    {
      "type": "feature",
      "variant": "square",
      "badge": "Batismo",
      "title": "Quero me batizar",
      "url": "https://chat.whatsapp.com/...",
      "gradient": "linear-gradient(135deg, #3b5bdb 0%, #1a2a6c 100%)"
    }
  ]
}
```

---

## Fluxo de atualização (sem rebuild)

**Com editor online (HostGator):** edite em `/editor/` → **Salvar** → recarregue o site.

**Sem editor:** edite `bio.json` no servidor (FTP ou Gerenciador de Arquivos) e recarregue a página.

1. Altere textos, links ou seções
2. Salve (botão no editor ou upload do arquivo)
3. Recarregue a página no navegador (`Ctrl+F5` se necessário)

O app resolve o caminho do `bio.json` em runtime (`bio-path.json`, `bio-json.php` ou raiz) e busca com `cache: 'no-store'`.

### O que **exige** rebuild

| Mudança | Rebuild? |
|---------|----------|
| Textos, links, seções no `bio.json` | Não |
| Imagens em `bio/public/assets/` | Não* |
| Código React, CSS, novos tipos de card | Sim |
| Dependências (`package.json`) | Sim |

\* Após adicionar imagens novas em produção, faça upload do arquivo para `assets/` no servidor. Não precisa rebuild, só garantir que o arquivo exista.

---

## Erros comuns

| Problema | Causa provável |
|----------|----------------|
| Página em branco com mensagem de erro | JSON inválido (vírgula extra, aspas faltando) |
| Card não aparece | `type` incorreto, typo no JSON, ou fora da janela de `schedule` |
| Imagem não carrega | Caminho errado — use `assets/arquivo.ext` (relativo à pasta do bio.json) |
| Mudança não reflete | Cache do navegador — use `Ctrl+F5` |
| Seção sem título mas com espaço | `title` deve ser `""` (string vazia), não omitido se quiser sem label |
| Card agendado some “do nada” | Confira `schedule.from` / `schedule.until` e o fuso `America/Sao_Paulo` |

Valide o JSON em [jsonlint.com](https://jsonlint.com) antes de salvar em produção.

---

## Tipo reservado (não implementado)

O schema TypeScript inclui `type: "instagram"` para cards de ministérios no Instagram (estilo Voe Connect), mas **ainda não é renderizado**. Se adicionar no JSON hoje, o card será ignorado.

Para habilitar no futuro, será necessário alteração no código (`BioSection.tsx`).
