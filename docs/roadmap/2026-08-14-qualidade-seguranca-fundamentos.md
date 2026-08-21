# Roadmap: Segurança, Qualidade e Fundamentos (auditoria geral)

**Criado em:** 2026-08-14
**Branch de trabalho sugerida:** `chore/seguranca-qualidade-fundamentos` (a partir de `main`, ou da branch atual depois que `feature/formularios-paginas-funil` for mergeada — ver Fase 0)
**Ferramenta de execução:** Cursor. Este documento serve de roteiro; cada fase tem um prompt pronto para colar no Cursor.

## Contexto

Este documento nasce de uma auditoria completa do projeto (4 análises independentes: bugs/segurança, qualidade de código, UX/UI e arquitetura/infra), feita para responder "o que falta pro insta-bio ficar bom em produção e o que precisa melhorar". Os relatórios completos, com evidência de código linha a linha, ficam em:

- `docs/bugs/2026-08-14-auditoria-geral.md` — 10 bugs (1 crítico, 3 altos, 4 médios, 2 baixos)
- `docs/bad-code/2026-08-14/` — 17 achados de qualidade/débito técnico (00-resumo.md + 5 partes)
- `docs/ui-ux/2026-08-14-auditoria-geral.md` — 11 problemas de UI/UX
- (arquitetura/infra não gerou arquivo — achados incorporados diretamente abaixo)

Este roadmap **consolida e prioriza** esses achados em fases pequenas e executáveis, na mesma lógica do roadmap de features (`docs/roadmap/2026-08-14-formularios-paginas-funil.md`): cada fase é um commit isolado e revertível.

**Ordem das trilhas — siga nessa sequência**, não pule a Trilha A:

- **Trilha A — Segurança crítica.** Tem 1 falha de RCE confirmada e mais 4 problemas de alto risco. Faça isso antes de qualquer feature nova, inclusive antes de continuar `feature/formularios-paginas-funil` se ela ainda não foi ao ar.
- **Trilha B — Bugs de dados/regras de negócio.** Inclui um bug que quebra a entrega da feature de Formulários (respostas mostram IDs em vez dos labels).
- **Trilha C — Fundamentos de engenharia.** Testes, typecheck e CI: sem isso, toda refatoração das trilhas D/E é arriscada.
- **Trilha D — Débito de arquitetura no front.** Duplicação e um "god component" que encarecem qualquer mudança futura.
- **Trilha E — UX e consistência.** Polimento de produto, menor risco técnico, mas afeta conversão e confiança do usuário.

## Como usar este documento

1. Antes da Fase 0, garanta a working tree limpa (commit ou stash do que já está pendente).
2. Para cada fase: abra o Cursor no projeto, cole o prompt da fase, revise o diff gerado, rode os comandos de verificação listados em "Como testar", corrija o que for preciso, e só então rode o commit sugerido.
3. Se algo quebrar numa fase, é só `git reset --hard HEAD~1` (ou `git revert <hash>` se já tiver dado push) — por isso cada fase é pequena e autocontida.
4. Não pule fases nem junte commits dentro de uma trilha. Entre trilhas, se o tempo for curto, priorize A → B → C antes de D/E.
5. Alguns prompts pedem para o Cursor **investigar antes de alterar** (ex.: Fase 2) porque duas análises independentes divergiram num detalhe factual — é proposital: deixe o Cursor confirmar o estado real do código antes de aplicar a mudança.

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
  AAAA_MM_DD_NNNNNN_create_<tabela>_table.php.
- Models usam o atributo #[Fillable([...])] (não $fillable tradicional).
- No front, tipos do JSON da bio ficam em resources/js/bio/types/bio.ts; hooks de dados ficam
  em resources/js/editor/hooks/ e resources/js/app/hooks/, separados da UI (veja
  resources/js/app/hooks/useSettings.ts como referência).
- Comentários e nomes em português, no mesmo tom enxuto já usado no código.
- Ao final, rode `composer run test` (ou o comando de teste do Makefile) e o build do front
  (`npm run build`) antes de finalizar.
```

---

## Fase 0 — Preparar terreno

**Objetivo:** confirmar o estado do repo e criar a branch de trabalho.

**Prompt para o Cursor:**
```
Estou prestes a começar uma sequência de correções de segurança/qualidade neste repositório
Laravel + React (insta-bio). Antes de tocar em código:
1. Rode `git status` e `git log --oneline -5` e me mostre o resultado.
2. NÃO descarte nada. Se houver mudanças não commitadas, pare e me avise.
3. Me diga se a branch atual é `feature/formularios-paginas-funil` e se ela já tem PR/merge
   pendente — se sim, pergunte se devo continuar nela ou criar
   `chore/seguranca-qualidade-fundamentos` a partir de `main`.
4. Uma vez decidido, crie/troque para a branch definida.
```

**Commit desta fase:** nenhum.

---

## Trilha A — Segurança crítica

### Fase 1 — Bloquear upload de arquivo malicioso (RCE confirmado)

**Objetivo:** hoje `POST /api/assets/upload` aceita qualquer arquivo — inclusive um `shell.php` disfarçado de imagem — e grava dentro de `storage/app/public/`, exposto publicamente via Apache/mod_php. Isso é execução remota de código, não uma hipótese: qualquer usuário autenticado (inclusive Free) consegue.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Isto é uma correção de segurança CRÍTICA (RCE confirmada), priorize exatidão sobre velocidade.

Contexto do bug: app/Services/MediaStorageService.php:17-26 usa
pathinfo($originalName, PATHINFO_EXTENSION) — a extensão informada pelo CLIENTE — para nomear
o arquivo salvo em storage/app/public/bios/{bio_id}/..., que é servido publicamente via
symlink public/storage (recriado em bin/deploy.sh). app/UseCases/Media/UploadMedia.php:27-46 e
app/Services/PlanGate.php:64-76 não validam tipo de conteúdo, só contagem/tamanho.

1. Em app/Services/MediaPayloadDecoder.php (e no ponto de entrada multipart, se for outro),
   detecte o MIME real do binário recebido com finfo_buffer (FILEINFO_MIME_TYPE) — NUNCA
   confie no Content-Type ou no nome de arquivo enviado pelo cliente.
2. Defina uma allow-list fechada de MIME permitidos: image/jpeg, image/png, image/webp,
   image/gif. NÃO inclua image/svg+xml (SVG pode carregar script) a menos que eu peça
   explicitamente sanitização de SVG à parte.
3. Se o MIME detectado não estiver na allow-list, rejeite com ApplicationException (422,
   mensagem clara tipo "Formato de arquivo não suportado").
4. Em app/Services/MediaStorageService.php::store, gere a extensão do arquivo salvo a partir
   de um mapa fixo mime→extensão (nunca de pathinfo() do nome original).
5. Como defesa em profundidade, crie storage/app/public/.htaccess desabilitando execução de
   PHP nesse diretório (php_flag engine off, e um <FilesMatch> negando .php/.phtml/.phar) e
   garanta que bin/deploy.sh preserva esse arquivo ao sincronizar o storage em produção
   (confira se o rsync/cp usado no deploy não sobrescreve ou ignora arquivos ocultos).
6. Adicione um teste Feature em tests/Feature/ cobrindo: upload de um PNG válido (aceito) e
   upload de um arquivo com conteúdo PHP renomeado para .jpg (rejeitado com 422).

Rode composer run test antes de finalizar.
```

**Como testar:** enviar via curl um arquivo `<?php echo 'x'; ?>` renomeado `foto.jpg` para o endpoint de upload autenticado — deve ser rejeitado. Confirmar que upload de imagem real continua funcionando no editor.

**Commit sugerido:**
```
git add -A
git commit -m "Bloqueie upload de arquivos fora da allow-list de mídia (previne RCE)"
```

---

### Fase 2 — Rate limiting nas rotas públicas críticas

**Objetivo:** conter brute force de login, spam de cadastro e flood de eventos de analytics.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Duas auditorias independentes divergiram sobre o estado atual do throttle em routes/web.php —
por isso, ANTES de alterar, investigue e me mostre o que já existe:
1. Abra routes/web.php e me diga se POST /login e POST /cadastro já têm middleware `throttle`
   aplicado (algum `throttle:login` custom em app/Providers/, ou nada).
2. Abra routes/bio.php e confirme se POST /api/analytics/track e GET /api/public/bio/{slug}
   têm `throttle`.

Depois de eu confirmar o que falta, aplique:
- POST /login e POST /cadastro: throttle:6,1 por IP (ou por email+IP, o que for mais simples
  de aplicar no padrão Laravel já usado no projeto), se ainda não existir.
- POST /api/analytics/track: throttle:60,1 (é chamado a cada visita/scroll, não pode ser tão
  restritivo quanto login, mas precisa de teto).
- GET /api/public/bio/{slug}: throttle:120,1 (tráfego legítimo de visitantes é alto; o
  objetivo aqui é só conter scraping/DoS abusivo, não usuários reais).
Ajuste os números acima se, ao investigar o tráfego esperado, fizer mais sentido outro valor
— documente a razão da escolha num comentário curto acima da rota.

Rode composer run test antes de finalizar.
```

**Como testar:** disparar mais requisições que o limite contra `/login` e `/api/analytics/track` num loop curto e confirmar resposta 429 a partir do limite configurado.

**Commit sugerido:**
```
git add -A
git commit -m "Adicione rate limiting às rotas públicas de login, cadastro e analytics"
```

---

### Fase 3 — Validar assinatura do webhook do Mercado Pago

**Objetivo:** `MP_WEBHOOK_SECRET` existe em config mas nunca é lido — qualquer requisição não autenticada para `webhooks/mercadopago` dispara chamadas de saída para a API da MP.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

A rota webhooks/mercadopago (pública, CSRF-exempt em bootstrap/app.php:31) chama
app/Services/MercadoPagoService.php::handleWebhook (linhas 179-197) sem validar a assinatura
do request, apesar de MP_WEBHOOK_SECRET já existir em config/services.php:47 e .env.example.

1. Implemente a validação de assinatura do webhook do Mercado Pago conforme a documentação
   oficial (header x-signature + x-request-id, HMAC-SHA256 usando MP_WEBHOOK_SECRET sobre o
   template `id:{data.id};request-id:{x-request-id};ts:{ts};`). Se o secret não estiver
   configurado no .env local (ambiente de dev), logue um warning e siga sem bloquear — mas em
   produção, requisição com assinatura ausente/inválida deve retornar 401 antes de processar
   qualquer coisa.
2. Adicione throttle na rota (ex.: throttle:30,1) — ver bootstrap/app.php ou routes onde ela
   está registrada.
3. Adicione teste Feature simulando webhook com assinatura válida (aceito) e inválida
   (rejeitado com 401), mockando o timestamp/secret conforme necessário.

Rode composer run test antes de finalizar.
```

**Como testar:** enviar POST para a rota do webhook sem header `x-signature` — deve retornar 401. Confirmar que o fluxo real de pagamento (sandbox do Mercado Pago) continua funcionando.

**Commit sugerido:**
```
git add -A
git commit -m "Valide assinatura do webhook do Mercado Pago antes de processar"
```

---

### Fase 4 — Corrigir "parar impersonação" do admin (rota travada)

**Objetivo:** hoje não existe caminho funcional para o admin sair de uma conta impersonada — a rota de saída está atrás do próprio middleware que ela precisa contornar.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Bug: routes/admin.php registra POST /api/admin/stop-impersonating dentro do grupo
middleware(['auth','verified','admin']). Quando um admin impersona alguém
(app/UseCases/Admin/ImpersonateUser.php faz Auth::login($bio->user)), o usuário autenticado na
sessão passa a ser o impersonado (não-admin) — logo qualquer chamada a stop-impersonating cai
em EnsureAdmin::class, que barra com 403 porque checa is_admin do usuário ATUAL. Não há saída.

1. Mova a rota POST /api/admin/stop-impersonating para fora do grupo `admin` (mantenha
   auth+verified).
2. Em app/UseCases/Admin/StopImpersonating.php e no middleware/guard relevante, baseie a
   autorização em session('impersonator_id') (setado por ImpersonateUser ao logar como o
   usuário-alvo) em vez de is_admin do usuário atual. Se não houver impersonator_id na sessão,
   retorne 403/404 (não há impersonação ativa para encerrar).
3. Em app/Services/SessionPresenter.php (ou onde SessionPresenter::for() é montado), adicione
   um campo `impersonating: bool` no payload de sessão exposto ao front.
4. No front admin (resources/js/admin/), adicione um banner fixo visível enquanto
   `impersonating` for true, com botão "Voltar para admin" chamando o endpoint corrigido.
5. Adicione um teste Feature: admin impersona usuário → chama stop-impersonating → volta a
   estar autenticado como o admin original.

Rode composer run test antes de finalizar.
```

**Como testar:** como admin, impersonar um usuário de teste, confirmar o banner "Voltar para admin", clicar e confirmar volta à sessão de admin.

**Commit sugerido:**
```
git add -A
git commit -m "Corrija saída de impersonação de admin (rota estava inacessível)"
```

---

### Fase 5 — Consistência de bio suspensa (`requireActive`)

**Objetivo:** UseCases de Media, BioPage, BioForm e Leads usam `CurrentBioService::require()` em vez de `requireActive()` — uma bio suspensa pelo admin continua recebendo upload, novas páginas, formulários e leads, mesmo com a vitrine pública bloqueada.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero decidir e aplicar um critério único e documentado para quando usar
CurrentBioService::require() vs requireActive().

1. Liste todos os UseCases que hoje chamam CurrentBioService::require($user) (grep no
   projeto) e separe em dois grupos: os que fazem ESCRITA/mutação de dados vinculados à bio
   (media, bio-page, bio-form, leads, domain, etc.) e os que são só leitura ou não fazem
   sentido bloquear (ex.: listar planos, dados de conta).
2. Para o grupo de escrita, troque para requireActive() — o critério é: se a bio está
   suspensa, o dono não deveria conseguir criar/alterar conteúdo dela, só visualizar/exportar
   o que já existe (ex.: ver leads e respostas antigas continua liberado, criar novo lead
   manualmente ou nova página não).
3. Documente esse critério com um comentário curto no próprio CurrentBioService.php acima dos
   dois métodos, para não regredir da próxima vez que alguém criar um UseCase novo.
4. Adicione/ajuste testes Feature cobrindo pelo menos um UseCase de cada área (media, bio-page
   ou bio-form, leads) confirmando 403/ApplicationException quando a bio está suspensa.

Rode composer run test antes de finalizar.
```

**Como testar:** suspender uma bio de teste via admin, tentar fazer upload de imagem ou criar página interna nela — deve ser bloqueado com mensagem clara.

**Commit sugerido:**
```
git add -A
git commit -m "Bloqueie escrita de conteúdo em bios suspensas de forma consistente"
```

---

## Trilha B — Bugs de dados e regras de negócio

### Fase 6 — Corrigir snapshot de labels nas respostas de formulário

**Objetivo:** a tela "Respostas" e o CSV exportado mostram o `id` técnico do campo (ex.: `campo-1755188273841-x7z2q`) em vez do label digitado pelo dono ("Nome", "E-mail"). Isso quebra a entrega principal da feature de Formulários — ninguém consegue ler as respostas.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Bug: as respostas de formulário (tabela form_submissions, coluna `answers`) são gravadas como
mapa `field.id => valor`, e a tela de respostas / export CSV renderiza as chaves cruas desse
mapa como cabeçalho de coluna, em vez do `label` que o dono configurou pra cada campo no
editor. Se o dono editar/reordenar os campos do formulário depois de já ter respostas
antigas, a correspondência id→label pode até mudar de sentido.

Escolha e implemente a abordagem mais simples e correta:
1. No momento do submit (app/UseCases/Forms/SubmitFormResponse.php), grave em `answers` não só
   `field.id => valor`, mas também um snapshot de `field.label` por resposta — pode ser um
   formato tipo `{ [fieldId]: { label: string, value: string } }`, ou uma coluna JSON separada
   `fields_snapshot` com o array de FormField no momento do envio. Escolha o que exigir menos
   mudança de schema mantendo a leitura simples no front.
2. Ajuste a tela de respostas (resources/js/app/pages/FormSubmissionsPage.tsx ou onde estiver)
   e a geração de CSV para usar o label salvo, não o id.
3. Para respostas JÁ EXISTENTES no banco (gravadas antes dessa correção, se houver dados de
   teste), eu decido depois se vale a pena migrar dado antigo — não escreva migration de dados
   agora, só me avise se detectar linhas nesse formato antigo.
4. Adicione um teste Feature cobrindo: enviar formulário → listar respostas → confirmar que o
   label aparece corretamente, mesmo depois de o dono renomear um campo do formulário.

Rode composer run test e o build do front antes de finalizar.
```

**Como testar:** criar formulário com campos "Nome" e "E-mail", enviar uma resposta pela bio pública, abrir a tela de Respostas e confirmar que as colunas mostram "Nome"/"E-mail" (não os ids), inclusive no CSV exportado.

**Commit sugerido:**
```
git add -A
git commit -m "Corrija exibição de respostas de formulário para usar o label do campo"
```

---

### Fase 7 — Validação server-side de campos obrigatórios do formulário

**Objetivo:** hoje `required` só é validado no client — chamar a API direto permite gravar resposta vazia, poluindo dados e o funil de leads.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Em app/UseCases/Forms/SubmitFormResponse.php, os campos marcados `required: true` na
definição do formulário (FormCard.fields) não são validados no servidor, só no componente
React. Adicione validação server-side: antes de gravar a FormSubmission, carregue a definição
do FormCard correspondente (section_id/item_index na bio publicada) e rejeite com
ApplicationException (422) se algum campo required vier ausente/vazio em `answers`. Mantenha a
mensagem de erro específica o suficiente para o front conseguir mostrar qual campo falhou, sem
vazar detalhes internos.

Adicione um teste Feature: submit sem preencher campo obrigatório → 422; submit completo →
201/sucesso.

Rode composer run test antes de finalizar.
```

**Como testar:** enviar POST direto (curl/Postman) para o endpoint de submit de formulário sem um campo obrigatório — deve ser rejeitado.

**Commit sugerido:**
```
git add -A
git commit -m "Valide campos obrigatórios do formulário também no servidor"
```

---

### Fase 8 — Travar corrida de criação dupla de bio no onboarding

**Objetivo:** sem constraint de unicidade nem transação, um double-submit no onboarding pode criar duas bios para o mesmo usuário (uma órfã, com slug perdido).

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Em app/UseCases/Onboarding/CompleteOnboarding.php:20-23, a criação da bio não está protegida
contra double-submit (ex.: usuário clica duas vezes rápido, ou perde conexão e reenvia).

1. Adicione uma migration com constraint `unique(user_id)` na tabela `bios` (confirme antes se
   já não existe alguma regra de negócio legítima para múltiplas bios por usuário — pelo nome
   `CurrentBioService` parece que não, mas confirme lendo esse serviço antes de assumir).
2. Envolva a criação em `DB::transaction()` e trate a exceção de unique constraint violation
   retornando uma ApplicationException amigável ("Você já tem uma bio criada") em vez de
   erro 500 cru.
3. No front, desabilite o botão de submit do onboarding assim que o clique inicial disparar a
   requisição, para reduzir a chance de double-submit na origem também.
4. Adicione um teste Feature simulando duas chamadas concorrentes/sequenciais ao endpoint de
   onboarding para o mesmo usuário e confirmando que só uma bio é criada.

Rode a migration e composer run test antes de finalizar.
```

**Como testar:** clicar duas vezes rápido no botão de concluir onboarding (ou disparar duas requisições concorrentes via script) e confirmar que só uma bio é criada.

**Commit sugerido:**
```
git add -A
git commit -m "Previna criação duplicada de bio no onboarding"
```

---

### Fase 9 — Aplicar `PlanGate` a páginas internas e formulários

**Objetivo:** hoje o limite free/pro vale para links/imagens/domínio, mas páginas internas e formulários são ilimitados em qualquer plano — furo na régua de monetização, já sinalizado como pendência conhecida no roadmap de features.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Esta fase depende de uma decisão de produto: quero um limite razoável, não preciso do número
exato agora — sugira um valor plausível (ex.: Free = 1 página interna e 1 formulário; Pro =
ilimitado, ou um teto alto tipo 20) e me avise claramente no resumo final da resposta que esse
número é uma sugestão para eu validar, não uma decisão definitiva.

1. Adicione as chaves relevantes em config/linksnabio.php (ex.: max_bio_pages,
   max_form_cards por plano), seguindo o mesmo padrão das chaves de max_links já existentes.
2. Em app/Services/PlanGate.php, adicione métodos assertCanCreateBioPage(Bio $bio) e (se fizer
   sentido separar do limite de cards já existente) um limite específico para quantos blocos
   `form` a bio pode ter.
3. Chame esses asserts nos UseCases de criação relevantes (app/UseCases/BioPage/CreateBioPage,
   e no ponto onde um bloco `form` é adicionado/salvo na bio ou numa página interna).
4. No front, mostre uma mensagem clara de upgrade quando o limite for atingido (siga o padrão
   já usado para o limite de links, se existir um componente/toast específico para isso).
5. Adicione teste Feature cobrindo: plano Free atinge o limite → próxima criação é bloqueada
   com ApplicationException; plano Pro não é bloqueado (ou respeita o teto alto definido).

Rode composer run test antes de finalizar.
```

**Como testar:** com uma conta Free de teste, criar páginas internas/formulários até o limite configurado e confirmar que a próxima tentativa é bloqueada com mensagem de upgrade.

**Commit sugerido:**
```
git add -A
git commit -m "Aplique limite de plano a páginas internas e formulários"
```

---

## Trilha C — Fundamentos de engenharia (testes, tipos, CI)

### Fase 10 — Ligar `tsc --noEmit` ao build/CI e corrigir erros de tipo existentes

**Objetivo:** o projeto tem `strict: true` no `tsconfig.json`, mas nada roda `tsc` — nem local, nem no CI. Já existem erros de tipo reais hoje (ex.: `Window` global duplicado com tipos conflitantes, import de tipo usado como valor). `package.json` não tem sequer um script `typecheck`.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

1. Adicione o script `"typecheck": "tsc --noEmit"` em package.json.
2. Rode `npm run typecheck` e me liste TODOS os erros retornados, com arquivo:linha.
3. Corrija cada um deles. Preste atenção especial em:
   - Declaração duplicada/conflitante do global `Window` (procure por `declare global` em
     mais de um arquivo de resources/js/ — provavelmente em algum arquivo de analytics/tracking
     e em outro do editor).
   - Imports de tipo usados como valor em runtime (deveriam usar `import type`).
   - Incompatibilidade de tipos apontada em torno de HeroLayoutFields (ou componente
     equivalente reportado pelo typecheck).
4. NÃO use `as any` ou `@ts-ignore` para calar os erros — corrija a causa raiz. Se algum erro
   for genuinamente ambíguo sobre a intenção original do código, pare e me pergunte antes de
   decidir sozinho.
5. Adicione o step de typecheck no .github/workflows/ci.yml, no job que já roda o build do
   frontend, ANTES do `npm run build`, para falhar cedo.

Rode npm run typecheck e npm run build (sem erros) antes de finalizar.
```

**Como testar:** rodar `npm run typecheck` localmente sem erros; abrir um PR de teste e confirmar que o CI executa o novo step.

**Commit sugerido:**
```
git add -A
git commit -m "Ligue typecheck do frontend ao build e corrija erros de tipo existentes"
```

---

### Fase 11 — Testes de feature para módulos sem cobertura nenhuma

**Objetivo:** ~130 UseCases no backend, mas só 4 arquivos de teste (14 métodos) cobrindo fatias de auth/bio/plan. Módulos inteiros — BioForm, BioPage, Leads, Media, Domain, Billing — não têm teste nenhum. Isso bloqueia qualquer refatoração segura das trilhas D/E.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero elevar a cobertura de teste dos módulos hoje sem NENHUM teste, priorizando o caminho
feliz + o limite de autorização multi-tenant (usuário A não pode acessar/alterar recurso de
usuário B) de cada um — não é para cobrir 100% de cada UseCase agora, é para sair de zero.

Para CADA uma das áreas abaixo, crie um arquivo tests/Feature/<Area>Test.php com pelo menos:
(a) um teste de caminho feliz da ação principal, e (b) um teste confirmando que a ação falha
(403/404, conforme o padrão já usado em outros testes do projeto) quando o usuário autenticado
não é dono do recurso:

1. BioForm (criar, salvar draft, publicar, excluir formulário)
2. BioPage (criar, salvar draft, publicar, excluir página interna)
3. Leads (listar, mover estágio, anotar, excluir — inclusive o teste de que um lead de outra
   bio não aparece/não pode ser alterado)
4. Media (upload válido, upload rejeitado por tipo — se a Fase 1 já não tiver coberto isso)
5. Domain (associar domínio customizado, os principais UseCases de
   app/UseCases/Domain/ — confira quais existem antes de escrever)
6. Billing (criação de checkout — sem chamar a API real do Mercado Pago, use fake/mock do
   client HTTP seguindo o padrão que o projeto já usa para isso, se houver algum teste
   parecido em outro lugar do repo para se inspirar; se não houver, mocke a classe de serviço)

Siga o estilo dos testes já existentes em tests/Feature/ (AuthTest.php, BioApiTest.php) para
factories, autenticação de teste e asserts.

Rode composer run test (todos passando) antes de finalizar. Se algum módulo tiver
dependência externa difícil de simular (ex.: Mercado Pago), pode ser um teste mais simples
focado só na parte que não depende da API externa — me avise no resumo final o que ficou de
fora e por quê.
```

**Como testar:** `composer run test` passando localmente, com os novos arquivos listados na saída.

**Commit sugerido:**
```
git add -A
git commit -m "Adicione testes de feature para BioForm, BioPage, Leads, Media, Domain e Billing"
```

---

### Fase 12 — CI cobrindo o frontend + alinhar `Makefile` ao PR template

**Objetivo:** o CI hoje só roda Pint/PHPStan/testes PHP; o job de "assets" só faz `npm ci && npm run build`, sem lint nem teste JS. O PR template exige `make check`, que não existe no Makefile — checklist de revisão desalinhado com a ferramenta real.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

1. Abra .github/PULL_REQUEST_TEMPLATE.md (ou onde estiver) e o Makefile, e me confirme se
   `make check` realmente não existe hoje.
2. Adicione um target `check` no Makefile que rode, em sequência, os comandos de lint/test já
   existentes no projeto (Pint --test, phpstan, composer run test, npm run typecheck depois da
   Fase 10) — o objetivo é ter UM comando que espelha o que o CI roda, para eu rodar localmente
   antes de abrir PR.
3. Em .github/workflows/ci.yml, garanta que o job de frontend rode npm run typecheck (se a
   Fase 10 já não tiver adicionado isso) e, se houver ESLint configurado no projeto, rode-o
   também — se NÃO houver ESLint configurado, não adicione um do zero nesta fase, apenas
   documente essa lacuna num comentário no workflow ou me avise no resumo final (adicionar
   ESLint do zero é uma decisão maior, trate como fora de escopo aqui).

Rode make check localmente (ou os comandos equivalentes) antes de finalizar.
```

**Como testar:** rodar `make check` localmente e confirmar que reproduz os mesmos passos do CI.

**Commit sugerido:**
```
git add -A
git commit -m "Alinhe make check ao CI e adicione typecheck ao pipeline de frontend"
```

---

### Fase 13 — Error tracking real (Sentry)

**Objetivo:** o workflow de deploy já instrui "verifique o log e o Sentry" numa falha, mas não existe SDK do Sentry em lugar nenhum do projeto — falsa sensação de monitoramento.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Esta fase depende de eu ter (ou criar) uma conta/projeto no Sentry antes de rodar em
produção — implemente a integração, mas deixe claro no resumo final que falta eu configurar
o DSN real no ambiente de produção.

1. Instale sentry/sentry-laravel via composer e configure conforme a documentação oficial
   (publish do config, variável SENTRY_LARAVEL_DSN em .env.example).
2. Configure captura de exceções não tratadas (App\Exceptions\Handler ou o mecanismo
   equivalente do Laravel 11/12 que o projeto usa — confira app/Exceptions/ e
   bootstrap/app.php antes de decidir onde plugar).
3. NÃO reporte ApplicationException esperadas (erros de validação de negócio) como exceção
   no Sentry — só erros inesperados (500). Se o projeto já distingue isso em algum lugar
   (ex.: um render de exceção customizado), siga o mesmo critério.
4. Adicione a variável SENTRY_LARAVEL_DSN no .env.example (vazia) e documente no README como
   configurá-la.
5. Ajuste o comentário em .github/workflows/deploy.yml que menciona "Sentry" para deixar claro
   que agora é real (ou remova a menção se decidir não configurar agora — mas não deixe a
   mensagem enganosa).

Não é necessário adicionar teste automatizado para isto (é config de infra). Rode
composer run test para garantir que nada quebrou.
```

**Como testar:** disparar um erro proposital (ex.: rota de teste que lança exceção) em ambiente local com DSN configurado e confirmar que aparece no painel do Sentry.

**Commit sugerido:**
```
git add -A
git commit -m "Adicione error tracking real via Sentry"
```

---

### Fase 14 — Backup antes de migrate no deploy + cache da leitura pública da bio

**Objetivo:** duas melhorias de infra pequenas e independentes, mas relacionadas a "não quebrar produção": hoje `bin/deploy.sh` roda `migrate --force` sem backup nem rollback documentado, e toda visita à bio pública bate direto no MySQL sem cache — gargalo real em hospedagem compartilhada.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Duas mudanças independentes nesta fase — pode fazer num commit só por serem pequenas e do
mesmo tema de "resiliência de produção":

1. Backup antes de migrate: em bin/deploy.sh, antes de `php artisan migrate --force`, adicione
   um passo que gera um dump do banco (mysqldump, ajustando para o driver real usado em
   produção — confira .env.example/config/database.php) salvo com timestamp em um diretório
   que não seja versionado nem exposto publicamente. Documente no próprio script (comentário)
   qual é a política de retenção esperada (ex.: manter os últimos N dumps) — não precisa
   implementar rotação automática agora, só deixar claro.
2. Cache da leitura pública da bio: em app/UseCases/PublicBio (procure GetPublishedBioJson ou
   equivalente) e no PublicBioPresenter, adicione Cache::remember com uma chave que inclua o
   slug e seja invalidada no momento em que a bio é republicada (procure o UseCase de
   Publish/PublishBio e adicione a invalidação lá — Cache::forget da mesma chave). TTL
   sugerido: 5 minutos como fallback, mas a invalidação ativa no publish é o que garante que o
   dono veja a mudança na hora.

Rode composer run test antes de finalizar.
```

**Como testar:** publicar uma bio, conferir que a mudança aparece na hora na URL pública (cache invalidado corretamente); rodar o script de deploy num ambiente de teste e confirmar que o dump é gerado antes do migrate.

**Commit sugerido:**
```
git add -A
git commit -m "Adicione backup antes de migrate no deploy e cache na leitura pública da bio"
```

---

## Trilha D — Débito de arquitetura no front

### Fase 15 — Extrair `EditorApp.tsx` do "god component" para hooks dedicados

**Objetivo:** `EditorApp.tsx` tem 1185 linhas e 24 `useState`, concentrando auth, histórico undo/redo, save/publish/revert, drag e preview no mesmo componente — é o maior custo de manutenção do front hoje, e o único lugar sem a separação hook/UI que o resto do editor já segue (`useBioPages`, `useBioForms`).

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero refatorar resources/js/editor/EditorApp.tsx SEM mudar comportamento visível — é uma
refatoração pura de organização, não é para mudar UX nem contrato de API.

1. Antes de mexer, rode o build/typecheck para ter uma baseline limpa.
2. Extraia para hooks dedicados em resources/js/editor/hooks/ (seguindo o padrão já usado por
   useBioPages.ts/useBioForms.ts):
   - useEditorHistory (a lógica de undo/redo)
   - useBioDraftActions (os 4 handlers de save/publish/revert/restore-backup com a lógica de
     rede embutida hoje no componente)
   - Se fizer sentido separar mais (ex.: estado de drag-and-drop de seções/itens), avalie, mas
     não force separação onde o estado é genuinamente local de UI.
3. Mantenha EditorApp.tsx como orquestrador fino que consome esses hooks — o objetivo é reduzir
   drasticamente o número de useState locais e o tamanho do arquivo.
4. Depois da extração, rode npm run typecheck e npm run build e confirme que não há erro novo.
5. Teste manualmente (ou peça pra mim testar) o fluxo completo: editar, undo/redo, salvar
   rascunho, publicar, reverter — tudo precisa continuar idêntico ao comportamento anterior.

Não faça essa refatoração junto com nenhuma mudança de feature nova.
```

**Como testar:** fluxo manual completo no editor (editar → undo/redo → salvar → publicar → reverter) comparando com o comportamento antes da mudança; `npm run typecheck` e `npm run build` sem erros novos.

**Commit sugerido:**
```
git add -A
git commit -m "Extraia EditorApp.tsx em hooks dedicados de histórico e ações de draft"
```

---

### Fase 16 — Unificar `useBioForms`/`useBioPages` e `PagesPanel`/`FormsPanel`

**Objetivo:** `useBioForms.ts` e `useBioPages.ts` são essencialmente o mesmo hook de CRUD duplicado (só o formato do draft muda); `PagesPanel.tsx` e `FormsPanel.tsx` duplicam ~400 linhas de UI de lista/criação/exclusão quase espelhadas. Hoje, corrigir um bug de UX nessa lista exige mexer nos dois lugares.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero unificar a lógica duplicada entre Páginas internas e Formulários no editor, SEM mudar
comportamento visível de nenhuma das duas telas.

1. Compare resources/js/editor/hooks/useBioForms.ts e useBioPages.ts. Extraia um hook genérico
   parametrizado (ex.: useDraftCollection<T>, ou nome que fizer mais sentido) cobrindo
   list/select/create/save/delete/publish, com os dois hooks existentes virando wrappers finos
   dele (mantenha os nomes useBioForms/useBioPages para não quebrar quem já os importa, a não
   ser que eu prefira renomear os call sites também — se optar por isso, atualize todos os
   imports).
2. Compare resources/js/editor/components/PagesPanel.tsx e FormsPanel.tsx. Extraia um
   componente genérico de lista/criação/exclusão (ex.: DraftCollectionPanel) parametrizado por
   labels/rotas, com os dois painéis existentes configurando esse componente genérico em vez
   de duplicar o JSX.
3. Depois da extração, rode npm run typecheck e npm run build.
4. Teste manualmente (ou peça pra mim testar) o fluxo completo em AMBAS as telas — criar,
   editar, salvar, publicar, excluir — confirmando que nada mudou visualmente nem
   funcionalmente.

Não misture essa refatoração com a Fase 6 (bug de labels) nem com features novas.
```

**Como testar:** fluxo manual completo em Páginas internas e em Formulários (criar/editar/salvar/publicar/excluir), comparando com o comportamento anterior à mudança.

**Commit sugerido:**
```
git add -A
git commit -m "Unifique CRUD duplicado de páginas internas e formulários (hook e painel genéricos)"
```

---

### Fase 17 — Extrair serialização de `BioPage` para trait compartilhada

**Objetivo:** `BioForm` já tem a serialização extraída para a trait `SerializesBioForm`, reaproveitada em vários lugares. O equivalente para `BioPage` está copiado em 4 arquivos — o padrão do próprio projeto foi aplicado só de um lado.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Siga o mesmo padrão já usado em app/Models/BioForm.php (ou onde estiver a trait
SerializesBioForm) para criar o equivalente em BioPage.

1. Identifique os 4 pontos onde a serialização de BioPage está duplicada (grep por como
   BioPage é transformado em array/JSON no backend).
2. Extraia essa lógica para uma trait SerializesBioPage (mesmo estilo/localização de
   SerializesBioForm), e faça os 4 pontos usarem a trait em vez do código duplicado.
3. Confirme que o formato de saída (JSON) não muda em nenhum dos 4 pontos — é refatoração
   pura, não mudança de contrato de API.
4. Rode composer run test (os testes da Fase 11 para BioPage, se já existirem nesse ponto do
   trabalho, devem continuar passando sem alteração).

Rode composer run test antes de finalizar.
```

**Como testar:** `composer run test` passando; conferir manualmente que a resposta JSON de páginas internas (draft e publicada) é idêntica antes/depois.

**Commit sugerido:**
```
git add -A
git commit -m "Extraia serialização de BioPage para trait compartilhada"
```

---

## Trilha E — UX e consistência de produto

### Fase 18 — Unificar semântica de "Salvar" entre bio principal, formulários e páginas internas

**Objetivo:** na bio principal, "Salvar" grava rascunho e só "Publicar" (com confirmação) afeta o site ao vivo. Em Formulários e Páginas internas, "Salvar" já publica na hora, sem aviso equivalente — o mesmo verbo tem dois comportamentos diferentes no mesmo editor, risco real de publicação acidental de conteúdo incompleto.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Esta fase é uma decisão de produto simples que preciso confirmar antes de implementar: entre
as duas opções abaixo, vou escolher uma e você implementa só essa (não implemente as duas):

Opção A — trazer Formulários/Páginas internas para o modelo de dois passos da bio principal
(Salvar = rascunho, Publicar = ao vivo, com confirmação).
Opção B — manter "Salvar" como publicação imediata em Formulários/Páginas internas (é um
formulário/página simples, faz sentido ser mais direto), mas deixar isso explícito na UI: o
botão não se chama "Salvar" e sim algo como "Salvar e publicar", e ganha uma confirmação leve
na primeira vez (ou sempre, se for uma ação pouco frequente) — sem reintroduzir o fluxo de
rascunho completo.

[depois de eu responder qual opção, cole a opção escolhida como prompt separado — não peça pro
Cursor decidir sozinho, isso já foi simplificado de propósito em commits recentes
(ce9e68f, 40ddaf9, 60f61ef) e uma refatoração errada pode desfazer essa simplificação]
```

**Como testar:** (depende da opção escolhida) — confirmar que o rótulo do botão e o comportamento real batem, e que não há mais divergência de expectativa entre as três telas do editor.

**Commit sugerido:** (depende da opção escolhida, definir na hora)

---

### Fase 19 — Acessibilidade de foco e padronização de confirmação de exclusão

**Objetivo:** o modal de formulário na bio pública não tem foco inicial nem trap de Tab (foco pode "vazar" atrás do overlay para usuários de teclado/leitor de tela, na tela de maior conversão do produto); o `ConfirmDialog` do editor também não faz trap completo; e a exclusão de lead usa `window.confirm()` nativo em vez do componente padronizado.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Três correções relacionadas a foco/confirmação, agrupadas por serem pequenas e do mesmo tema:

1. Crie (ou reaproveite, se já existir algo parecido) um hook compartilhado de focus-trap em
   resources/js/ (ex.: resources/js/shared/hooks/useFocusTrap.ts, ou local equivalente ao
   padrão de organização já usado no projeto) que: foca o primeiro elemento focável ao abrir,
   prende Tab/Shift+Tab dentro do container, e devolve o foco ao elemento que abriu o
   modal/dialog ao fechar.
2. Aplique esse hook em resources/js/bio/components/FormModal.tsx (modal de formulário na bio
   pública).
3. Aplique o MESMO hook em resources/js/editor/components/ConfirmDialog.tsx, substituindo o
   foco parcial que só mira o botão Cancelar hoje.
4. Em resources/js/app/components/LeadsPanel.tsx (ou onde estiver a exclusão de lead), troque
   o window.confirm() nativo pelo componente ConfirmDialog já usado no resto do editor, para
   manter a consistência visual/de acessibilidade da ação mais destrutiva do painel de Funil.

Teste manualmente com navegação por teclado (Tab/Shift+Tab/Esc) em ambos os modais depois da
mudança. Rode npm run build antes de finalizar.
```

**Como testar:** abrir o modal de formulário na bio pública e navegar só com Tab/Shift+Tab — o foco não deve escapar do modal; testar o mesmo no `ConfirmDialog` do editor; confirmar que excluir um lead abre o diálogo estilizado, não o `confirm()` do navegador.

**Commit sugerido:**
```
git add -A
git commit -m "Padronize focus-trap em modais e substitua window.confirm por ConfirmDialog"
```

---

### Fase 20 — Reorganizar topbar do editor para mobile

**Objetivo:** 3 dos ~8 botões da topbar fixa do editor (Respostas/Funil/Conta) já existem duplicados na navegação lateral (`editor-rail-nav`, que vira barra rolável em mobile). A largura estimada necessária ultrapassa a tela de um iPhone SE — risco de botões inacessíveis (inclusive "Sair") no dispositivo majoritário de uso do produto.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quero simplificar a topbar do editor (procure o componente de header/topbar fixo em
resources/js/editor/components/ — algo como EditorTopbar.tsx ou similar) removendo a
duplicação com a navegação lateral (editor-rail-nav).

1. Identifique quais botões da topbar hoje também existem na navegação lateral (Respostas de
   formulário, Funil, Conta são os já confirmados na auditoria — confirme se há mais).
2. Remova esses botões duplicados da topbar, mantendo-os só na navegação lateral (fonte única
   de verdade para navegação entre seções do editor).
3. Confirme que os botões que restam na topbar (essenciais, ex.: Salvar/Publicar, Sair) cabem
   confortavelmente numa tela de 320px de largura (iPhone SE) sem scroll horizontal nem corte.
4. Enquanto estiver nesse componente, ajuste os botões-ícone de toque frequente para pelo menos
   44x44px (hoje ~36px), seguindo diretriz de área mínima de toque.

Teste em viewport mobile (DevTools, 320px e 375px de largura) antes de finalizar. Rode
npm run build.
```

**Como testar:** abrir o editor em viewport de 320px (DevTools) e confirmar que todos os botões da topbar são visíveis e tocáveis sem scroll horizontal nem sobreposição.

**Commit sugerido:**
```
git add -A
git commit -m "Remova duplicação de navegação na topbar do editor e ajuste para mobile"
```

---

### Fase 21 — Polimentos visuais menores

**Objetivo:** um conjunto de ajustes pequenos e independentes, de baixo risco, que valem a pena agrupar num commit só.

**Prompt para o Cursor:**
```
[cole o bloco "Convenções do projeto"]

Quatro ajustes pequenos e independentes:

1. Foco em campos de formulário da bio pública (resources/js/bio/components/, componentes de
   input do FormCardBlock): hoje o foco depende só de uma mudança sutil de border-color. Reforce
   com um box-shadow/outline visível, calculado a partir da MESMA fonte de cor que o resto do
   tema da bio usa (não fixe uma cor hardcoded), para garantir contraste também em paletas
   escuras escolhidas pelo dono da bio.

2. Mensagem de erro do formulário público usa classes `dark:` do Tailwind (reage ao tema do
   SISTEMA OPERACIONAL do visitante) em vez do sistema de tema da própria bio
   (`data-bio-surface` + CSS vars, usado em todo o resto da bio pública). Troque para usar as
   mesmas CSS vars/data-attribute do tema da bio, único ponto hoje fora desse padrão.

3. `GridCard` (resources/js/bio/components/): título longo é cortado abruptamente pelo
   overflow:hidden sem reticências. Adicione line-clamp (2 linhas, com ellipsis) no título.

4. No painel admin, resources/js/admin/components/BioTable.tsx: o toggle de plano/status da
   bio de um cliente é hoje um clique em texto sem affordance de botão nem confirmação/loading
   state. Transforme num botão/switch com affordance visual clara, e adicione um
   ConfirmDialog (mesmo componente já usado no editor) antes de suspender uma bio — é uma ação
   com impacto direto no cliente.

Rode npm run build antes de finalizar. Teste cada um dos 4 pontos manualmente.
```

**Como testar:** verificar visualmente cada um dos 4 pontos (foco no formulário público em light/dark, mensagem de erro em bio com tema escuro escolhido pelo dono + SO do visitante em modo diferente, card com título longo, toggle de status no admin).

**Commit sugerido:**
```
git add -A
git commit -m "Ajuste polimentos visuais: foco de formulário, tema de erro, line-clamp e toggle admin"
```

---

## Depois das 21 fases

- **Fase 18 é bloqueante de decisão, não de código** — resolva-a cedo (é rápida de decidir) para não deixar a Trilha E pela metade.
- Depois da Trilha C, considere manter um teste por UseCase novo como norma daqui pra frente (não só recuperação de débito) — inclua isso como critério no PR template junto do `make check` corrigido na Fase 12.
- A Fase 9 (PlanGate para páginas/formulários) tem um número de limite sugerido pelo Cursor — revise e ajuste antes de divulgar a régua nova para clientes existentes (evite quebrar quem já passou do limite sugerido).
- Depois de ESTE roadmap, revisitar o roadmap de features (`docs/roadmap/2026-08-14-formularios-paginas-funil.md`) para retomar/concluir as fases pendentes dele com a base de segurança e testes já mais sólida.
- Os relatórios completos (`docs/bugs/`, `docs/bad-code/`, `docs/ui-ux/`) têm achados de severidade baixa que não viraram fase própria aqui por serem menores — vale uma passada neles depois da Trilha E para varrer o que sobrou.
