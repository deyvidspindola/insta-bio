# Analytics + Dashboard no Editor

Documento de especificação para implementação futura.  
Referência visual: dashboard com inventário (totais + variação no período), situação atual e gráficos de atividade (por dia / por horário).

Validar esse documento => [docs/Identificação-do-cliente.md](./docs/Identificação-do-cliente.md)

---

## 1. Objetivo (MVP)

Dentro do **editor do cliente**, uma aba **Dashboard** que mostre:


| Métrica              | Descrição                                                  |
| -------------------- | ---------------------------------------------------------- |
| Visualizações        | Cada abertura da bio (com data/hora)                       |
| Acessos únicos / dia | Visitantes distintos por dia (fingerprint leve, sem login) |
| Cliques              | Por link/card (quais performam mais)                       |
| Totais               | Hoje · período selecionado · acumulado                     |


Identificação na ingestão pública: `analytics_key` (UUID v4, único por cliente).  
No banco, eventos sempre amarrados a `clients.id`. O `slug` pode ser denormalizado nos eventos só para debug/ops — **não** é a chave do track.

**Não** enviar `license_token` no frontend público (é segredo de licença).  
**Não** expor `clients.id` sequencial no payload público (enumerável).

---



## 2. Escopo deste MVP

**Inclui**

- Coluna `clients.analytics_key` (UUID) + geração na criação / backfill
- Coleta de `pageview` e `click` na bio pública
- Endpoint de ingestão (público, rate-limited) autenticado por `analytics_key`
- Persistência em MySQL (painel) com FK `client_id`
- API autenticada de relatórios (sessão do editor)
- Aba Dashboard no editor (UI parecida com a referência)

**Fora do MVP**

- Relatório PDF / e-mail mensal
- Heatmap / scroll depth
- Integração Plausible/Umami
- Dashboard multi-cliente no painel admin
- Geolocalização / device detalhado

---



## 3. Identidade do cliente


| Contexto | Identificador | Como obter |
|----------|---------------|------------|
| Bio pública (track) | `analytics_key` | Injetar `window.__ANALYTICS_KEY__` no gate PHP a partir de `clients.analytics_key` (gravar também em `license.config.php` ou cache de licença) |
| Bio pública (URL) | `slug` | Path `/{slug}/` — só roteamento; não usar como chave de telemetria |
| Editor (relatórios) | `client_id` / `slug` da sessão | Sessão / `platform-auth` — nunca confiar no query string |
| Banco (eventos) | `client_id` (FK) | Resolve `analytics_key` → `clients.id` no `analytics-track.php` |
| Licença | `license_token` | Gate / updates / login — **nunca** no track |


Arquivos de referência:

- `panel/schema.sql` — tabela `clients` (+ coluna `analytics_key`)
- `panel/php/clients-create.php` — gerar UUID na criação
- `panel/php/lib/license.php` — expor chave no config/gate do cliente
- `editor/src/EditorApp.tsx` — rail de abas

### 3.1 `analytics_key`

- Formato: UUID v4 (`CHAR(36)`), UNIQUE, gerado uma vez na criação do cliente.
- Rotação: só sob ação explícita no painel (invalida a chave antiga; sites precisam republicar/sync do config).
- Risco se vazar: forjar pageviews/clicks daquele cliente (métricas sujas) — **não** dá acesso ao editor nem à licença. Mitigar com rate limit + `status = active`.
- Backfill: para clientes já existentes, gerar UUID e persistir antes de ligar o track.

---



## 4. Modelo de eventos



### 4.1 Tipos


| `event_type` | Quando                                 |
| ------------ | -------------------------------------- |
| `pageview`   | Bio carregou com sucesso (1× por load) |
| `click`      | Clique em link/card/rede social        |




### 4.2 Payload de ingestão (POST)

```json
{
  "analytics_key": "a1b2c3d4-e5f6-4789-a012-3456789abcde",
  "event_type": "pageview",
  "occurred_at": "2026-07-18T22:45:00-03:00",
  "visitor_id": "v_8f3a…",
  "session_id": "s_1c2d…",
  "path": "/",
  "referrer": "https://instagram.com/",
  "meta": {
    "section_id": "links",
    "item_index": 0,
    "item_type": "link",
    "label": "WhatsApp",
    "url": "https://wa.me/55…"
  }
}
```

- `analytics_key`: obrigatório — UUID do cliente (não enviar `slug` nem `license_token`).
- `pageview`: `meta` pode ser omitido ou mínimo.
- `click`: `meta` obrigatório (`section_id`, `item_index`, `item_type`, `url`; `label` se houver).
- `visitor_id`: UUID estável em `localStorage` (ex. `ib_vid`) — base dos **únicos/dia**.
- `session_id`: UUID em `sessionStorage` (opcional no MVP).



### 4.3 Regras

1. **Ignorar preview do editor** — se `document.documentElement.dataset.bioPreview === '1'`, não enviar nada.
2. Preferir `navigator.sendBeacon` / `fetch` com `keepalive` no click (não bloquear navegação).
3. Não trackear bots óbvios (User-Agent vazio / crawlers conhecidos — filtro no servidor).
4. Rate limit por IP + `analytics_key` (ex. 60 req/min).

---



## 5. Endpoint de ingestão



### 5.1 Público (bio → painel)

```
POST {LICENSE_API}/api/analytics/track
Content-Type: application/json
```

Sugestão de arquivo: `panel/php/analytics-track.php`  
(espelhar padrão de `license-check.php`: CORS restrito ou `*`, JSON `{ ok, error }`).

**Auth:** nenhuma sessão. Validar:

- `analytics_key` existe, formato UUID, e `clients.status = active`
- Resolver `client_id` (e opcionalmente `slug`) a partir da chave; gravar só `client_id` como FK
- body JSON válido + `event_type` ∈ {`pageview`,`click`}
- tamanho máximo do body (ex. 4 KB)

**Resposta**

```json
{ "ok": true }
```

Erros: `400` / `404` / `429` / `503` com `{ "ok": false, "error": "…" }`.

### 5.2 Relatórios (editor → painel, autenticado)

Sessão do editor já autenticada (mesmo fluxo de login remoto).


| Método | Rota                                                 | Uso                            |
| ------ | ---------------------------------------------------- | ------------------------------ |
| GET    | `/api/analytics/summary?from=&to=`                   | Cards do inventário + situação |
| GET    | `/api/analytics/timeseries?from=&to=&grain=day|hour` | Gráficos                       |
| GET    | `/api/analytics/clicks?from=&to=&limit=20`           | Ranking de links/cards         |


`client_id` / slug vêm da **sessão** (não confiar no query string do cliente).

Arquivos sugeridos:

- `panel/php/analytics-summary.php`
- `panel/php/analytics-timeseries.php`
- `panel/php/analytics-clicks.php`
- Front editor: `editor/src/lib/analytics.ts` + `editor/src/lib/endpoints.ts`

---



## 6. Banco de dados (MySQL)



### 6.0 Coluna em `clients`

```sql
ALTER TABLE clients
  ADD COLUMN analytics_key CHAR(36) NULL UNIQUE COMMENT 'UUID v4 para ingestão pública de analytics'
  AFTER license_token;

-- Backfill (exemplo; gerar UUID real por linha na app/migration):
-- UPDATE clients SET analytics_key = UUID() WHERE analytics_key IS NULL;
```

Gerar também em `clients-create.php` e incluir no `license.config.php` / gate (ex. `ANALYTICS_KEY`).

### 6.1 Eventos brutos

```sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id     INT UNSIGNED NOT NULL,
  slug          VARCHAR(40) NULL COMMENT 'denormalizado no insert; não é chave de auth',
  event_type    ENUM('pageview', 'click') NOT NULL,
  occurred_at   DATETIME NOT NULL,
  visitor_id    CHAR(36) NULL,
  session_id    CHAR(36) NULL,
  path          VARCHAR(255) NULL,
  referrer      VARCHAR(512) NULL,
  section_id    VARCHAR(80) NULL,
  item_index    SMALLINT UNSIGNED NULL,
  item_type     VARCHAR(40) NULL,
  label         VARCHAR(160) NULL,
  target_url    VARCHAR(1024) NULL,
  ip_hash       CHAR(64) NULL COMMENT 'hash do IP, não IP cru',
  user_agent    VARCHAR(255) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_client_time (client_id, occurred_at),
  INDEX idx_type_time (event_type, occurred_at),
  INDEX idx_visitor_day (client_id, event_type, visitor_id, occurred_at),
  CONSTRAINT fk_analytics_client FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE CASCADE
);
```



### 6.2 Agregados diários (opcional, fase 2)

Para aliviar queries do dashboard:

```sql
CREATE TABLE IF NOT EXISTS analytics_daily (
  client_id     INT UNSIGNED NOT NULL,
  day           DATE NOT NULL,
  pageviews     INT UNSIGNED NOT NULL DEFAULT 0,
  uniques       INT UNSIGNED NOT NULL DEFAULT 0,
  clicks        INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (client_id, day),
  CONSTRAINT fk_analytics_daily_client FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE CASCADE
);
```

MVP pode agregar só em cima de `analytics_events`; `analytics_daily` entra se o volume crescer.

### 6.3 Métricas derivadas


| Nome                    | Cálculo                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Visualizações (período) | `COUNT(*)` onde `event_type = pageview` e `occurred_at` no range                    |
| Únicos (período)        | `COUNT(DISTINCT visitor_id)` pageviews no range                                     |
| Únicos (hoje)           | idem, `DATE(occurred_at) = CURDATE()`                                               |
| Cliques (período)       | `COUNT(*)` onde `event_type = click`                                                |
| Ranking                 | `GROUP BY section_id, item_index, item_type, label, target_url` ORDER BY count DESC |
| Por hora                | `GROUP BY HOUR(occurred_at)` no range (ou grain=hour)                               |
| Comparativo             | mesmo range deslocado para trás (ex. últimos 7 dias vs 7 anteriores)                |


---



## 7. Coleta na bio (frontend)



### 7.1 Pageview

Hook após load OK:

- `bio/src/App.tsx` ou `BioPage.tsx`
- Enviar 1× por montagem (guard com `useRef`)



### 7.2 Click — pontos de instrumentação


| Prioridade | Arquivo                                            | Notas                      |
| ---------- | -------------------------------------------------- | -------------------------- |
| Alta       | `bio/src/lib/cardLink.tsx`                         | Cobre a maioria dos cards  |
| Média      | `SocialLinksRow.tsx`, Instagram em `BioHeader.tsx` | Redes                      |
| Média      | `VideoCard.tsx`                                    | Âncora própria             |
| Baixa      | Produtos / lightbox                                | Só se fizer sentido no MVP |


Payload do click deve incluir `section.id` + índice do item (já usados no preview).

### 7.3 Helper sugerido

`bio/src/lib/analytics.ts`:

- `getAnalyticsKey()` — lê `window.__ANALYTICS_KEY__` (sem chave → no-op)
- `getVisitorId()` / `getSessionId()`
- `trackPageview()`
- `trackClick({ sectionId, itemIndex, itemType, label, url })`
- URL do endpoint: `window.__ANALYTICS_URL__` injetada pelo gate **ou** `{LICENSE_API}/api/analytics/track` (sem `license_token`)

---



## 8. Dashboard no editor (UI)



### 8.1 Navegação

Nova aba no rail de `EditorApp.tsx`:

```
dashboard → identity → appearance → sections → images → advanced
```

- Label: **Dashboard** / short **Stats**
- Exibir no modo `demo` com dados de exemplo (sem API)
- Ícone sugerido: `LayoutDashboard` (lucide)



### 8.2 Layout (alinhado à referência)

1. **Topo** — título “Dashboard”, subtítulo “Visão geral da bio”, filtro de período (`Últimos 7 dias` · 30 · 90 · personalizado).
2. **Inventário** — cards grandes:
  - Visualizações (total + Δ no período)
  - Acessos únicos
  - Cliques
  - Taxa clique/visualização (opcional)
3. **Situação agora** — cards menores:
  - Visualizações hoje
  - Únicos hoje
  - Cliques hoje
  - Card mais clicado (label)
4. **Atividade** — dois gráficos:
  - Visualizações por dia (série atual vs período anterior)
  - Horários com mais acessos (grain=hour; toggle Período / Hoje)
5. **Ranking de cliques** — tabela/lista: label, tipo, URL truncada, quantidade, % do total

Biblioteca de gráfico: a que o projeto já usar, ou leve (ex. Recharts) — decidir na implementação.

---



## 9. Arquitetura (fluxo)

```
Visitante → Bio (React)
              │ pageview / click
              ▼
     POST /api/analytics/track  (painel PHP)
              │
              ▼
         MySQL analytics_events
              │
Cliente logado → Editor Dashboard
              │ GET summary / timeseries / clicks
              ▼
     panel PHP (sessão editor) → JSON → UI
```

---



## 10. Fases de implementação



### Fase A — Fundação

1. Migration SQL: `clients.analytics_key` + `analytics_events` (+ backfill UUID)
2. Gerar `analytics_key` em `clients-create.php`; expor no gate/`license.config.php`
3. `analytics-track.php` + rate limit + resolve `client_id` por `analytics_key`
4. Injetar `__ANALYTICS_KEY__` e URL de track no gate da bio
5. `trackPageview` + instrumentação em `CardLink`



### Fase B — Relatórios API

1. Endpoints summary / timeseries / clicks (auth editor)
2. `editor/src/lib/analytics.ts` + endpoints



### Fase C — UI Dashboard

1. Aba no rail + componente `DashboardPanel`
2. Cards + ranking + gráficos
3. Filtro de período + comparativo



### Fase D — Endurecimento

1. Tabela `analytics_daily` (job ou update incremental no track)
2. Retenção (ex. raw 90 dias, daily indefinido)
3. Testes manuais: preview não conta; demo mostra Dashboard com dados de exemplo; `analytics_key` inválida / cliente inativo rejeita

---



## 11. Privacidade e LGPD (mínimo)

- Não armazenar IP em claro — só `hash(IP + salt)` se necessário anti-abuse.
- `visitor_id` é pseudônimo local; documentar na política de privacidade do produto.
- Não coletar PII nos eventos.
- Opt-out futuro: flag no `bio.json` / config avançada (`analytics.enabled`).

---



## 12. Critérios de aceite (MVP)

- [ ] Abrir a bio gera 1 pageview com `occurred_at` correto
- [ ] Recarregar em outro browser gera outro `visitor_id` (únicos sobem)
- [ ] Clique em um link grava evento com seção/índice/URL
- [ ] Preview do editor **não** gera eventos; demo mostra Dashboard com dados de exemplo
- [ ] Dashboard no editor mostra totais do período e ranking coerente com os eventos
- [ ] Cliente A não vê dados do cliente B (`client_id` da sessão)
- [ ] Track sem `analytics_key` / com UUID inexistente retorna 404
- [ ] `license_token` **não** aparece no payload nem em `window.__*` de analytics

---



## 13. Referências no repo


| Assunto            | Caminho                                                        |
| ------------------ | -------------------------------------------------------------- |
| Roadmap antigo     | `docs/MELHORIAS.md` (Analytics de cliques)                     |
| Schema clientes    | `panel/schema.sql`                                             |
| Rail do editor     | `editor/src/EditorApp.tsx`                                     |
| Links da bio       | `bio/src/lib/cardLink.tsx`                                     |
| Endpoints editor   | `editor/src/lib/endpoints.ts`                                  |
| Auth editor remoto | `panel/php/editor-session.php`, `editor/php/platform-auth.php` |


---



## 14. Decisões já tomadas neste doc


| Tema            | Decisão                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| Storage         | MySQL no painel (não JSON local no cliente)                            |
| ID público track| `analytics_key` (UUID v4 em `clients`) — não slug, não `license_token` |
| ID interno      | `client_id` (FK); slug só denormalizado opcional                       |
| Únicos          | `visitor_id` em localStorage                                           |
| UI              | Aba no editor do cliente (não painel admin)                            |
| Ingestão        | Endpoint PHP público no painel                                         |
| Relatórios      | Endpoints PHP autenticados pela sessão do editor                       |


