# Roadmap: Formulários, Páginas Internas e Funil de Prospects

**Criado em:** 2026-08-14
**Branch de trabalho sugerida:** `feature/formularios-paginas-funil` (a partir de `v2`)
**Ferramenta de execução:** Cursor (já tem o contexto do projeto). Este documento serve de roteiro; cada fase tem um prompt pronto para colar no Cursor.

## Contexto

Objetivo: sair de "página de links" pura para "da bio ao lead, sem sair da plataforma", com três recursos **simples** (não é para virar um construtor de site nem um CRM completo):

1. **Formulários** — bloco de formulário próprio na bio, sem depender do Tally.
2. **Páginas internas** — abrir uma "sub-página" simples (mesmo motor de blocos da bio) sem sair da plataforma, sem virar site.
3. **Funil de prospects** — Kanban simples para acompanhar leads capturados via formulários e cliques (WhatsApp), sem depender de planilha à parte.

Ordem escolhida (cada uma deixa a próxima mais barata): **Formulários → Páginas internas → Funil**.

Guardrails que valem para as três (repetir em qualquer prompt que envolva escopo novo):
- Sem canvas livre, sem HTML customizado pelo usuário, sem SEO/roteamento genérico — tudo reaproveita o modelo de `sections[].items[]` que já existe.
- Página interna tem **um nível só**: uma página interna não pode conter outra página interna.
- Funil é **manual** (o dono arrasta/move o estágio) — nada de automação, scoring ou disparo de e-mail nesta fase.

## Como usar este documento

1. Antes da Fase 0, garanta a working tree limpa (commit ou stash do que já está pendente) — isso é importante para que cada fase vire um commit revertível de forma isolada, sem misturar com WIP de outras mudanças.
2. Para cada fase: abra o Cursor no projeto, cole o prompt da fase (o bloco de código), revise o diff gerado, rode os comandos de verificação listados em "Como testar", corrija o que for preciso, e só então rode o commit sugerido.
3. Se algo quebrar numa fase, é só `git reset --hard HEAD~1` (ou `git revert <hash>` se já tiver dado push) — por isso cada fase é pequena e autocontida.
4. Não pule fases nem junte commits — o valor de ir por fases é justamente conseguir abandonar/reverter uma feature específica sem perder as outras.

## Convenções do projeto (repita nos prompts do Cursor)

Cole este bloco (ou resuma) em qualquer prompt para manter o Cursor alinhado com o padrão já existente no repo:

```
Siga rigorosamente os padrões já usados no projeto:
- Controllers em app/Http/Controllers/ NÃO acessam banco nem têm regra de negócio: só validam
  o HTTP (Form Request quando precisar de validação) e chamam um UseCase->execute(...).
- Cada ação de negócio é uma classe final em app/UseCases/<Area>/<Verbo><Entidade>.php com um
  único método execute().
- Todo acesso Eloquent fica isolado em um Repository de app/Repositories/ (só ele consulta o
  Model diretamente).
- Regra de negócio que falha lança App\Exceptions\ApplicationException(mensagem, status_http).
- Bio "atual" do usuário logado se obtém com CurrentBioService::require($user) (ou
  requireActive quando precisar bloquear bio suspensa).
- Limites por plano (free/pro) ficam em config/linksnabio.php e são checados via
  App\Services\PlanGate.
- Migrations novas seguem o padrão de database/migrations/2026_08_12_*: nome
  AAAA_MM_DD_NNNNNN_create_<tabela>_table.php, Schema::create com
  $table->foreignId('bio_id')->constrained()->cascadeOnDelete() quando pertence a uma bio.
- Models usam o atributo #[Fillable([...])] (não $fillable tradicional).
- No front, tipos do JSON da bio ficam em resources/js/bio/types/bio.ts; um novo tipo de card
  entra na union SectionItem, ganha componente de renderização em resources/js/bio/components/
  (registrado no switch de resources/js/bio/components/BioSection.tsx) e editor de campos em
  resources/js/editor/components/item-editors/ (registrado em ItemTypeFields.tsx e na lista
  CARD_TYPES de resources/js/editor/lib/bio.ts).
- Comentários e nomes em português, no mesmo tom enxuto já usado no código (ver docblocks
  existentes como referência de estilo).
- Ao final, rode `composer run test` (ou o comando de teste do Makefile) e o build do front
  (`npm run build` ou `npm run typecheck`, o que já existir no package.json) antes de finalizar.
```

---

## Fase 0 — Preparar terreno

**Objetivo:** isolar este trabalho de qualquer alteração pendente e criar a branch.

**Prompt para o Cursor:**
```
Estou prestes a começar uma sequência de features neste repositório Laravel + React
(insta-bio). Antes de tocar em código:
1. Rode `git status` e me mostre o que está pendente.
2. NÃO descarte nada. Se houver mudanças não commitadas, pare e me avise — vou decidir se
   commito ou dou stash antes de prosseguir.
3. Se a working tree já estiver limpa, crie e mude para a branch `feature/formularios-paginas-funil`
   a partir da branch atual.
```

**Commit desta fase:** nenhum (é só organização de branch).

---

## Track A — Formulários

### Fase 1 — Bloco de formulário no schema da bio + editor

**Objetivo:** um novo tipo de card `form` que o dono da bio monta no editor (título, campos simples: texto/e-mail/telefone/textarea, texto do botão), renderizado na bio pública como formulário real (ainda sem persistir nada — isso é a Fase 2).

**Escopo:** só schema + editor + renderização visual. Sem submit funcional ainda (botão pode ficar desabilitado ou só validar client-side por enquanto).

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto" acima]

Quero adicionar um novo tipo de bloco `FormCard` ao schema da bio, seguindo o mesmo padrão
dos demais cards (ex.: TextBlock, ListCard) em resources/js/bio/types/bio.ts.

1. Em resources/js/bio/types/bio.ts:
   - Crie `FormFieldType = 'text' | 'email' | 'phone' | 'textarea'`.
   - Crie `FormField { id: string; type: FormFieldType; label: string; required?: boolean;
     placeholder?: string }`.
   - Crie `FormCard { type: 'form'; title?: string; description?: string; fields: FormField[];
     submitLabel?: string; successMessage?: string; schedule?: CardSchedule }`.
   - Adicione `FormCard` na union `SectionItem`.

2. Crie resources/js/bio/components/FormCardBlock.tsx: renderiza os campos do formulário
   (inputs simples controlados em estado local do componente) e um botão de enviar. Por
   enquanto, ao enviar, apenas mostre `successMessage` (ou um texto padrão) sem chamar API —
   isso será ligado na próxima fase. Siga o estilo visual dos outros cards em
   resources/js/bio/components/ (ex.: TextBlock.tsx, ListCard.tsx) para markup/classes.

3. Registre `FormCardBlock` no switch de resources/js/bio/components/BioSection.tsx, do
   mesmo jeito que os outros tipos já estão registrados ali.

4. Crie resources/js/editor/components/item-editors/FormItemFields.tsx: editor com campo de
   título, descrição, texto do botão, mensagem de sucesso, e uma lista editável de campos
   (adicionar/remover/reordenar campo, escolher tipo, label, obrigatório). Use o componente
   `Field` já existente nesta pasta para os inputs, no mesmo padrão de
   resources/js/editor/components/item-editors/ListItemFields.tsx.

5. Registre o novo tipo em resources/js/editor/components/item-editors/ItemTypeFields.tsx
   (bloco `item.type === 'form'`) e adicione a entrada em `CARD_TYPES` de
   resources/js/editor/lib/bio.ts (label "Formulário", hint curto explicando o uso — captar
   contato sem sair da bio).

6. Adicione um exemplo de bloco `form` (com 2-3 campos) em algum theme pack ou no
   database/data/bio.default.json — o que fizer mais sentido para servir de referência
   visual, sem quebrar o JSON existente.

Não crie nada de backend ainda (sem migration, sem endpoint) — isso é a próxima fase. Rode o
build do front (`npm run build` ou `npm run typecheck`) e me avise se der erro de tipo em
algum outro arquivo que consome a union `SectionItem` (ex.: switches exaustivos).
```

**Como testar:** abrir o editor, adicionar o bloco "Formulário" numa seção, configurar campos, ver o preview renderizar o formulário na bio.

**Commit sugerido:**
```
git add -A
git commit -m "Adicione bloco de formulário no schema, editor e renderização da bio"
```

---

### Fase 2 — Persistência de respostas (submit real)

**Objetivo:** o botão de enviar do Fase 1 passa a gravar de verdade.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero persistir as respostas do bloco `form` criado na fase anterior.

1. Crie a migration database/migrations/AAAA_MM_DD_NNNNNN_create_form_submissions_table.php
   (data de hoje, número sequencial depois da última migration existente) com colunas: id,
   bio_id (foreignId, cascadeOnDelete), section_id (string), item_index (unsignedInteger),
   form_title (string, nullable — snapshot do título no momento do envio), answers (json —
   mapa field.id => valor respondido), visitor_id (string, nullable — mesmo conceito usado em
   analytics_events), ip (string, nullable), timestamps.

2. Crie app/Models/FormSubmission.php com #[Fillable(...)] cobrindo as colunas acima, cast de
   `answers` para array, e um `belongsTo(Bio::class)`.

3. Crie app/Repositories/FormSubmissionRepository.php: método `create(array $attributes)` e
   `forBio(Bio $bio)` (paginado/ordenado por created_at desc) — siga o estilo de
   app/Repositories/CustomDomainRepository.php.

4. Crie app/Http/Requests/SubmitFormRequest.php validando: analytics_key (required, string —
   mesma chave pública usada em TrackEvent para achar a bio sem autenticação), section_id
   (required, string), item_index (required, integer), answers (required, array). Adicione
   também um campo honeypot opcional (ex.: `website` — se vier preenchido, é bot) e valide
   que fica vazio.

5. Crie app/UseCases/Forms/SubmitFormResponse.php (final class, execute(array $payload,
   ?string $ip)): resolve a Bio pela analytics_key (mesmo padrão de
   app/UseCases/Analytics/TrackEvent.php — falha silenciosa/ignora se a bio não existir ou
   não estiver ativa), grava via FormSubmissionRepository.

6. Crie app/Http/Controllers/FormController.php com o método `submit`, injetando
   SubmitFormRequest, SubmitFormResponse. Retorne JSON { ok: true }.

7. Registre a rota pública (SEM middleware de auth, é a bio pública enviando) em
   routes/bio.php, próxima da rota de /api/analytics/track:
   Route::post('/api/public/forms/submit', [FormController::class, 'submit']);
   Aplique um throttle simples (ex.: ->middleware('throttle:20,1')) para conter spam.

8. No front, atualize resources/js/bio/components/FormCardBlock.tsx para de fato enviar
   (fetch POST para /api/public/forms/submit) passando analytics_key (a bio pública já expõe
   essa chave para o tracking — reaproveite a mesma fonte que TrackEvent usa hoje no front,
   procure onde `analytics_key` é montado no client atual), section_id, item_index e o mapa
   de respostas. Trate estado de enviando/erro/sucesso simples.

Rode as migrations (`php artisan migrate`) e o teste do projeto antes de finalizar.
```

**Como testar:** preencher e enviar um formulário na bio pública publicada, conferir linha nova em `form_submissions` (`php artisan tinker` ou `make artisan tinker`).

**Commit sugerido:**
```
git add -A
git commit -m "Persista respostas do bloco de formulário via endpoint público"
```

---

### Fase 3 — Tela de respostas para o dono

**Objetivo:** o dono da bio consegue ver e exportar as respostas recebidas.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero uma tela simples para o dono da bio ver as respostas dos formulários.

1. Crie app/UseCases/Forms/GetFormSubmissions.php (execute(User $user, ?string $sectionId,
   ?int $itemIndex)): usa CurrentBioService->require($user) e
   FormSubmissionRepository->forBio($bio), com filtro opcional por section_id/item_index.

2. Adicione o método `index` em app/Http/Controllers/FormController.php chamando esse
   UseCase, e registre a rota autenticada em routes/bio.php dentro do grupo
   ['auth','verified','onboarded']: Route::get('/api/forms/submissions', [FormController::class, 'index']).

3. No front, crie resources/js/app/pages/FormSubmissionsPage.tsx (ou, se fizer mais sentido
   dado o roteamento do app atual, um componente dentro da tela de configurações) listando as
   respostas em tabela simples: data, campo por campo (colunas dinâmicas a partir das answers),
   com um filtro por qual bloco de formulário (se houver mais de um na bio). Siga o padrão de
   página do projeto (PageShell, hooks separados da UI — veja resources/js/app/hooks/useSettings.ts
   como referência de como isolar chamada de API em hook).

4. Adicione um botão "Exportar CSV" que apenas gera o CSV no client a partir dos dados já
   carregados (sem endpoint novo de export) — mantenha simples.

5. Adicione o link de navegação para essa tela onde fizer mais sentido (ex.: junto ao menu do
   editor/app, perto de "Configurações").

Rode o build do front e o teste do projeto antes de finalizar.
```

**Como testar:** enviar algumas respostas na bio pública e conferir que aparecem na tela nova, com export CSV funcionando.

**Commit sugerido:**
```
git add -A
git commit -m "Adicione tela de respostas de formulários para o dono da bio"
```

---

## Track B — Páginas internas

### Fase 4 — Modelo e CRUD de páginas internas

**Objetivo:** uma bio pode ter N "páginas internas" (cada uma com seu próprio `sections[]`, reaproveitando o mesmo schema).

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero um recurso de "páginas internas": sub-páginas simples da bio, com o MESMO motor de
blocos da bio principal (sections[].items[]), sem identidade própria (herdam brand/tema da
bio pai) e sem poder conter outra página interna dentro delas.

1. Crie a migration create_bio_pages_table com: id, bio_id (foreignId, cascadeOnDelete),
   slug (string — único por bio_id, não globalmente), title (string), json_draft (json,
   nullable), json_published (json, nullable), status (string, default 'draft'),
   timestamps. Adicione um índice único composto (bio_id, slug).

2. Crie app/Models/BioPage.php com #[Fillable(...)], casts de json_draft/json_published para
   array, belongsTo(Bio::class). Siga o Model app/Models/Bio.php como referência de estilo
   (ele já tem json_draft/json_published/json_backup — o mesmo padrão, só que sem backup por
   enquanto).

3. Crie app/Repositories/BioPageRepository.php: listForBio(Bio $bio), findBySlug(Bio $bio,
   string $slug), create/update/delete — siga o estilo de app/Repositories/BioRepository.php.

4. Crie os UseCases em app/UseCases/BioPage/ (um arquivo por ação, final class, execute()):
   - ListBioPages (lista as páginas da bio do usuário logado)
   - CreateBioPage (valida slug único na bio, cria com sections vazio)
   - SaveBioPageDraft (salva json_draft)
   - PublishBioPage (copia json_draft para json_published, status = 'published')
   - DeleteBioPage
   Reaproveite CurrentBioService->require($user) em todos. Para validar/limpar o JSON de
   entrada, veja como app/Services/BioConfigParser.php é usado hoje em SaveBioRequest — decida
   se dá para reaproveitar o mesmo parser (a página interna só tem `sections`, não `brand`) ou
   se precisa de uma variante mais simples; escolha a opção mais próxima do padrão existente.

5. Crie app/Http/Requests/SaveBioPageRequest.php e app/Http/Controllers/BioPageController.php
   (index, store, update/save, publish, destroy) e registre as rotas autenticadas em
   routes/bio.php:
   /api/bio/pages (GET, POST)
   /api/bio/pages/{slug} (PUT ou PATCH para salvar draft, DELETE)
   /api/bio/pages/{slug}/publish (POST)

Rode a migration e os testes antes de finalizar. Ainda NÃO mexa no front nem na rota pública
de visualização — isso é a próxima fase.
```

**Como testar:** via `php artisan tinker` ou requisições diretas (curl/Postman) autenticado, criar/listar/publicar uma página interna e conferir no banco.

**Commit sugerido:**
```
git add -A
git commit -m "Adicione modelo e CRUD de páginas internas da bio"
```

---

### Fase 5 — Página pública e link "abrir página interna"

**Objetivo:** a página interna fica acessível em `/{slug}/{pageSlug}` reaproveitando o `BioPage.tsx`, e os cards que já têm ação de clique (link, feature, app-hero, whatsapp-hero) ganham a opção de apontar para uma página interna em vez de uma URL externa.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero expor as páginas internas criadas na fase anterior publicamente e permitir que os
cards da bio apontem para elas.

1. Backend: crie app/UseCases/PublicBioPage/ShowPublicBioPage.php, no mesmo padrão de
   app/UseCases/PublicBio/ShowPublicBio.php, mas resolvendo bio + BioPage por slug/pageSlug e
   usando o json_published da página. O `brand`/tema exibido deve ser o da BIO PAI (a página
   interna não tem brand própria, só sections) — monte o `BioConfig` combinando
   `bio.json_published.brand` com `bioPage.json_published.sections`.

2. Registre a rota pública em routes/bio.php, logo antes da rota `/{slug}` já existente:
   Route::get('/{slug}/{pageSlug}', [PublicBioController::class, 'showPage'])
       ->where('slug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?')
       ->where('pageSlug', '[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?');
   Adicione o método `showPage` em app/Http/Controllers/PublicBioController.php chamando o
   UseCase novo. Confira se isso não colide com nenhuma rota já reservada (veja
   `reserved_slugs` em config/linksnabio.php) e se a ordem das rotas no arquivo não faz o
   `/{slug}` capturar `/{slug}/{pageSlug}` por engano.

3. Front público: em resources/js/bio/, reaproveite o componente BioPage.tsx para renderizar
   a página interna a partir do JSON retornado pela rota nova — não crie um layout paralelo.

4. Editor — extensão da ação de clique: em resources/js/bio/types/bio.ts, estenda `CardAction`
   para incluir `'page'`, e adicione um campo opcional `pageSlug?: string` nos tipos que usam
   CardAction (WhatsAppHero, AppHero, FeatureCard, LinkCard — os mesmos citados em
   `CardActionItem` de resources/js/editor/components/item-editors/ItemTypeFields.tsx).

5. Em resources/js/editor/components/item-editors/CardActionField.tsx, adicione a opção
   "Abrir página interna" em CARD_ACTION_OPTIONS. Quando selecionada, troque o campo de URL
   por um select com as páginas internas já criadas na bio (busque a lista via
   /api/bio/pages). Ajuste `urlFieldLabel`/`urlFieldPlaceholder` ou a lógica de exibição do
   campo conforme necessário para não mostrar o campo de URL quando a ação for 'page'.

6. Ajuste o local do front que resolve o destino do clique na bio pública (procure onde
   `action`/`url` dos cards é usado para montar o `href` — provavelmente perto de
   CardActionIcon.tsx ou dentro de cada componente de card em resources/js/bio/components/)
   para, quando action === 'page', montar o link como `/{slug atual}/{pageSlug}` em vez de
   usar `url`.

Rode build do front e os testes antes de finalizar.
```

**Como testar:** criar uma página interna com um bloco de texto, publicar, criar um link na bio principal com ação "Abrir página interna" apontando pra ela, publicar a bio, e navegar até `/{slug}/{pageSlug}` pelo card.

**Commit sugerido:**
```
git add -A
git commit -m "Exponha páginas internas publicamente e ligue via ação de card"
```

---

### Fase 6 — Editor de páginas internas na UI

**Objetivo:** o dono cria/edita/publica páginas internas sem sair do editor, reaproveitando os componentes de seção/item já existentes.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero uma UI no editor para gerenciar as páginas internas (CRUD da Fase 4 + preview da
Fase 5), sem duplicar o editor de seções que já existe para a bio principal.

1. Crie um hook resources/js/editor/hooks/useBioPages.ts (ou local equivalente ao padrão já
   usado por outros hooks do editor) que carrega a lista de páginas (/api/bio/pages), permite
   criar (título → gera slug), selecionar uma página para editar, salvar draft, publicar e
   excluir.

2. Adicione uma entrada "Páginas" na navegação do editor (veja
   resources/js/editor/components/SectionSidebar.tsx para o padrão de navegação lateral
   atual) que leva a uma tela listando as páginas internas da bio (título, slug, status
   rascunho/publicado, ações editar/excluir) e um botão "Nova página".

3. Ao editar uma página interna, reaproveite os componentes já existentes de
   resources/js/editor/components/ (SectionEditor.tsx, ItemEditor.tsx, SectionOrderSheet.tsx,
   AddBlockPicker.tsx) operando sobre o `sections[]` da BioPage em vez do `sections[]` da bio
   principal — a ideia é que a experiência de montar uma página interna seja idêntica à de
   montar a bio, só que trocando a fonte/destino dos dados (useBioPages em vez do estado da
   bio principal).

4. Adicione um preview simples da página interna (pode reaproveitar o mesmo mecanismo de
   preview já usado para a bio principal, apontando para o BioPage.tsx com o JSON da página).

Rode build do front e os testes antes de finalizar.
```

**Como testar:** fluxo completo pela UI — criar página interna, adicionar blocos, publicar, abrir preview, criar um link na bio apontando pra ela, conferir no ar.

**Commit sugerido:**
```
git add -A
git commit -m "Adicione editor de páginas internas na UI do editor"
```

---

## Track C — Funil de prospects

### Fase 7 — Modelo de lead + captura automática

**Objetivo:** toda resposta de formulário (Track A) e clique em WhatsApp hero vira um "lead" que entra automaticamente no funil, estágio inicial "Novo".

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero um funil de prospects simples e MANUAL (sem automação, sem scoring, sem disparo de
e-mail) alimentado pelo que já rastreamos hoje.

1. Crie a migration create_leads_table com: id, bio_id (foreignId, cascadeOnDelete), name
   (string, nullable), contact (string, nullable — telefone/e-mail, o que vier),
   source_type (string — ex.: 'form', 'whatsapp-hero'), source_label (string, nullable —
   ex. título do bloco de origem), stage (string, default 'novo'), notes (text, nullable),
   timestamps. Valores possíveis de stage: novo, contatado, negociando, fechado, perdido
   (documente isso em comentário no Model, não precisa de enum de banco).

2. Crie app/Models/Lead.php (#[Fillable], belongsTo(Bio::class)) e
   app/Repositories/LeadRepository.php (create, forBio ordenado por created_at desc,
   updateStage, updateNotes, delete) seguindo o padrão de FormSubmissionRepository criado na
   Fase 2.

3. Crie app/UseCases/Leads/CreateLeadFromFormSubmission.php (final class, execute
   recebendo o FormSubmission recém-criado): tenta extrair `name`/`contact` das `answers`
   olhando os FormField cujo `type` seja 'email'/'phone' ou cujo `label` contenha
   "nome"/"e-mail"/"telefone" (heurística simples, não precisa ser perfeita), monta
   source_type = 'form', source_label = form_title, e grava via LeadRepository.

4. Chame esse UseCase novo dentro de app/UseCases/Forms/SubmitFormResponse.php (Fase 2), logo
   depois de gravar o FormSubmission — assim toda resposta de formulário já cai automaticamente
   no funil.

5. Em app/UseCases/Analytics/TrackEvent.php, quando `item_type === 'whatsapp-hero'` e o
   evento for 'click', crie também um Lead (source_type = 'whatsapp-hero', source_label =
   $meta['label'] ?? null, name/contact nulos — o clique não dá esse dado, só sinaliza
   interesse). Avalie se isso deve ser condicional a alguma flag para não gerar ruído
   excessivo (ex.: 1 lead por visitor_id por dia por bio, para não duplicar a cada clique do
   mesmo visitante) — implemente essa deduplicação simples na criação do lead de
   whatsapp-hero.

Rode a migration e os testes antes de finalizar. Ainda sem UI — isso é a próxima fase.
```

**Como testar:** enviar um formulário e clicar num bloco WhatsApp hero na bio pública, conferir que linhas aparecem na tabela `leads` com os dados esperados.

**Commit sugerido:**
```
git add -A
git commit -m "Capture leads automaticamente a partir de formulários e cliques em WhatsApp"
```

---

### Fase 8 — API do funil

**Objetivo:** endpoints para listar leads e mover estágio/anotar.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero a API para o dono da bio gerenciar os leads capturados na fase anterior.

1. Crie os UseCases em app/UseCases/Leads/: ListLeads (execute(User $user) — retorna todos os
   leads da bio do usuário, agrupáveis por stage no front), UpdateLeadStage (execute(User,
   int $leadId, string $stage) — valida que o lead pertence à bio do usuário antes de
   atualizar, senão lança ApplicationException 404), UpdateLeadNotes (idem, para o campo
   notes), DeleteLead (idem).

2. Crie app/Http/Requests/UpdateLeadStageRequest.php validando que `stage` é um dos valores
   permitidos (novo, contatado, negociando, fechado, perdido).

3. Crie app/Http/Controllers/LeadController.php (index, updateStage, updateNotes, destroy) e
   registre as rotas autenticadas em routes/bio.php:
   /api/leads (GET)
   /api/leads/{id}/stage (PATCH)
   /api/leads/{id}/notes (PATCH)
   /api/leads/{id} (DELETE)

Rode os testes antes de finalizar. Ainda sem UI — isso é a próxima fase.
```

**Como testar:** requisições autenticadas diretas (curl/Postman) para listar e mover o estágio de um lead criado na Fase 7.

**Commit sugerido:**
```
git add -A
git commit -m "Adicione API para listar e mover estágio dos leads do funil"
```

---

### Fase 9 — Kanban do funil na UI

**Objetivo:** tela simples com colunas por estágio, mover lead entre colunas, ver/editar anotação.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero uma tela de Kanban SIMPLES para o funil de prospects — sem biblioteca de
drag-and-drop nova se o projeto não tiver uma já instalada; se não tiver, use botões
"Mover para →" em vez de arrastar, para não adicionar dependência só por isso.

1. Crie um hook resources/js/app/hooks/useLeads.ts que carrega /api/leads e expõe ações para
   mover estágio, salvar nota e excluir, seguindo o padrão de resources/js/app/hooks/useSettings.ts.

2. Crie resources/js/app/pages/LeadsPage.tsx: 5 colunas fixas (Novo, Contatado, Negociando,
   Fechado, Perdido), cada uma listando os leads naquele estágio como cards simples (nome ou
   "Sem nome", contato se houver, origem — badge com source_label, data). Cada card tem um
   select ou botões para mudar de estágio e um campo de nota expansível.

3. Adicione a rota da página no app (veja como as demais páginas de resources/js/app/pages/
   são registradas) e um link de navegação para "Funil" próximo ao link de "Configurações"
   ou "Respostas de formulários" da Fase 3.

Rode build do front e os testes antes de finalizar.
```

**Como testar:** gerar leads reais (Fase 7), abrir a tela nova, mover um lead de coluna, adicionar uma nota, recarregar a página e confirmar que persistiu.

**Commit sugerido:**
```
git add -A
git commit -m "Adicione Kanban do funil de prospects na UI"
```

---

## Depois das 9 fases

- Revise se `PlanGate`/`config/linksnabio.php` deveriam ganhar um limite para free (ex.: máx. de leads/mês, máx. de páginas internas) — decisão de produto, não técnica; não faça isso "de brinde" dentro de uma fase acima sem decidir antes.
- Se o volume de leads de WhatsApp virar ruído (Fase 7, item 5), ajuste a deduplicação antes de divulgar a feature.
- Considere um teste automatizado por UseCase novo (o projeto já roda `composer run test` — siga o padrão de teste existente para as áreas equivalentes, ex. testes de Domain/Billing, ao criar os de Forms/BioPage/Leads).
