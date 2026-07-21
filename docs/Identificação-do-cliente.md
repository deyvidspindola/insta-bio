## 1. Identificação do cliente

**Chave de URL / pasta:** `slug` → `/{slug}/` e FS do cliente.  
**Chave de telemetria (analytics):** `analytics_key` (UUID v4) — ver especificação em [ANALYTICS-DASHBOARD.md](./ANALYTICS-DASHBOARD.md).

| Camada | Identificadores | Arquivos |
|--------|-----------------|----------|
| MySQL (painel) | `clients.id`, `clients.slug` (UNIQUE), `clients.license_token` (CHAR 48), `clients.analytics_key` (CHAR 36 UUID, UNIQUE — a adicionar), `status`, `email` | `/home/drspindola/projetos/insta-bio/panel/schema.sql` |
| Extra na criação | `allowed_host`, `self_hosted`, `deploy_path`; gerar `analytics_key` | `/home/drspindola/projetos/insta-bio/panel/php/clients-create.php` |
| Instalação do cliente | `LICENSE_SLUG`, `LICENSE_TOKEN`, `LICENSE_API`, `ANALYTICS_KEY` (+ host/path) | `license.config.php` na raiz do cliente; gerado em `/home/drspindola/projetos/insta-bio/panel/php/lib/license.php` |
| Gate da bio | slug+token vs MySQL; cache `.license-cache.json`; injeta `window.__ANALYTICS_KEY__` | `/home/drspindola/projetos/insta-bio/panel/php/client-gate/client-license.php`, `license-check.php` |
| Editor | sessão PHP; login via painel com `slug` + `token` + `email` | `/home/drspindola/projetos/insta-bio/editor/php/platform-auth.php`, `/home/drspindola/projetos/insta-bio/panel/php/editor-session.php`, `/home/drspindola/projetos/insta-bio/panel/php/lib/editor-auth.php` |

**Para analytics (decisão):**

| Uso | Identificador | Motivo |
|-----|---------------|--------|
| POST `/api/analytics/track` (bio pública) | `analytics_key` | Opaco, estável, não é credencial de licença |
| Persistência / FK | `clients.id` (`client_id`) | Relacional; relatórios do editor |
| Relatórios no editor | sessão → `client_id` | Não confiar no client |
| URL da bio / pasta | `slug` | Roteamento; opcional denormalizado no evento |
| Gate / updates / login remoto | `license_token` | **Nunca** no frontend de analytics |

Tipos front do painel: `/home/drspindola/projetos/insta-bio/panel/src/lib/clients.ts` (`id`, `slug`, … — incluir `analytics_key` quando existir).

---

## 2. Analytics existente

**Não há** pageviews, cliques, tracking ou reporting implementados.

- Roadmap apenas: `/home/drspindola/projetos/insta-bio/docs/MELHORIAS.md` (“Analytics de cliques” — PHP+JSON ou Plausible/Umami).
- Sentry opcional no painel (erros), não produto: `SENTRY_DSN` em `/home/drspindola/projetos/insta-bio/panel/php/db.config.example.php`.

---

## 3. Onde a bio vive e como os links renderizam

**App:** `bio/` (React). Deploy vira a raiz do cliente (`/{slug}/`).

Fluxo:
1. Gate PHP: `/home/drspindola/projetos/insta-bio/panel/php/client-gate/index-gate.php` → `require_client_license_active()` → `index.html`
2. `/home/drspindola/projetos/insta-bio/bio/src/App.tsx` → `loadBioConfig()` → `BioPage`
3. `/home/drspindola/projetos/insta-bio/bio/src/components/BioPage.tsx` → `BioHeader` + `BioSectionBlock` por seção
4. `/home/drspindola/projetos/insta-bio/bio/src/components/BioSection.tsx` → cards por `item.type`

**Config:** JSON (`bio.json` / proxy `bio-json.php`); path via `window.__BIO_JSON_PATH__` ou `bio-path.json` — `/home/drspindola/projetos/insta-bio/bio/src/lib/loadBioConfig.ts`.

**Cliques outbound (quase todos):** `/home/drspindola/projetos/insta-bio/bio/src/lib/cardLink.tsx` (`CardLink` → `<a target="_blank">`).

Usado por: `LinkCard`, `FeatureCard`, `GridCard`, `LocationCard`, `AppHeroCard`.

**Fora do `CardLink`:**
- Redes: `/home/drspindola/projetos/insta-bio/bio/src/components/SocialLinksRow.tsx`, pill Instagram em `BioHeader.tsx`
- Vídeo com URL: `<a>` em `VideoCard.tsx`
- Produtos: lightbox (`ProductsCard.tsx`), não é o mesmo padrão de link externo

**IDs de conteúdo:** seções têm `section.id`; itens **não** têm id estável — só índice em `section.items` (`bio/src/types/bio.ts`).

**Preview do editor:** `dataset.bioPreview === '1'` intercepta cliques — ignorar no tracking.

---

## 4. Storage

| Dado | Onde |
|------|------|
| Admins + clientes + licenças | **MySQL** (`PDO`) — `/home/drspindola/projetos/insta-bio/panel/php/bootstrap.php` |
| Conteúdo da bio | **Arquivos JSON** — `bio.json` (público) + `bio.draft.json` — `/home/drspindola/projetos/insta-bio/editor/php/bio-storage.php` |
| Assets | FS `assets/` no cliente |
| Sites provisionados | FS `PLATFORM_ROOT/sites/{slug}/` (ex. `panel/sites/`) |

Não há SQLite. Dev Node só no Vite (`editor/server/`, `panel/server/`); produção HostGator = **PHP + MySQL + arquivos**.

---

## 5. Navegação do editor (onde caberia Dashboard)

Rail em `/home/drspindola/projetos/insta-bio/editor/src/EditorApp.tsx`:

```
identity → appearance → sections → images → advanced
```

Labels: Identidade, Aparência, Conteúdo, Arquivos, Configurações.

**Encaixe natural:** nova aba no `allRailTabs` (ex. `dashboard` antes de `identity` ou depois de `sections`). `EditorSubnav` é só sub-abas da Aparência — não o menu principal.

Painel admin (`panel/src/App.tsx`): só tab `clients` — analytics do **cliente** fica no editor, não no painel (salvo visão agregada multi-tenant).

---

## 6. Padrões de API (PHP vs Node)

**Produção = PHP.** Node só em middleware Vite no dev.

| App | Endpoints (front) | PHP |
|-----|-------------------|-----|
| Editor | `/home/drspindola/projetos/insta-bio/editor/src/lib/endpoints.ts` — `api/auth/*`, `api/bio/*`, `api/assets/*`, `api/update/*` | `editor/php/*.php` |
| Painel | `/home/drspindola/projetos/insta-bio/panel/src/lib/endpoints.ts` — `api/clients/*`, `api/auth/*`, license, updates | `panel/php/*.php` |

Contrato típico: JSON `{ ok, error, ... }`, sessão cookie no editor/painel; license-check público com `slug`+`token`.

---

## Hook points recomendados

**Pageview**
- Após load OK em `bio/src/App.tsx` (ou `useEffect` em `BioPage.tsx`).
- Payload: `{ analytics_key, event_type: 'pageview', … }` — chave de `window.__ANALYTICS_KEY__` (injetada no gate a partir de `clients.analytics_key`).
- Pular se `document.documentElement.dataset.bioPreview === '1'` ou se não houver `analytics_key`.

**Click**
1. **Principal:** estender `CardLink` em `cardLink.tsx` com `onClick` / `sendBeacon` antes da navegação — cobre a maioria dos cards.
2. **Também:** `SocialLinksRow`, Instagram em `BioHeader`, `VideoCard` (âncora própria).
3. Payload sugerido: `{ analytics_key, event_type: 'click', meta: { section_id, item_index, item_type, url, label } }` — `sectionId`+`itemIndex` já existem no preview wrapper em `BioSection.tsx`.

**API/storage sugeridos (alinhados ao stack)**
- Endpoint PHP no painel: `api/analytics/track` — resolve `analytics_key` → `client_id`.
- Persistência: MySQL (`analytics_events` com FK `client_id`; `slug` opcional denormalizado).
- UI: nova tab `dashboard` no rail do editor, lendo agregados via PHP autenticado (mesma sessão do editor → `client_id`).