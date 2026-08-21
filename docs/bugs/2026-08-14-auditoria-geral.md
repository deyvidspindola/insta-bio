# Relatório de Bugs — Auditoria geral (backend Laravel + front React), 2026-08-14

## Resumo
- Total de bugs encontrados: 10
- Críticos: 1 · Altos: 3 · Médios: 4 · Baixos: 2
- Áreas afetadas: editor (upload de mídia), admin (impersonação), auth, analytics público, billing, bio (onboarding/planos), forms/pages/leads (novas features do funil)

## Bug #1 — Upload de mídia sem validação de tipo/extensão permite RCE via webshell
- **Severidade:** Crítico
- **Categoria:** Segurança
- **Local:** `app/Services/MediaStorageService.php:17-26`, `app/Services/MediaPayloadDecoder.php:22-63`, `app/UseCases/Media/UploadMedia.php:27-46`, `app/Services/PlanGate.php:64-76`
- **Descrição:** O endpoint autenticado `POST /api/assets/upload` aceita qualquer arquivo (multipart ou base64) sem checar extensão nem MIME type contra uma allow-list. `MediaStorageService::store()` usa a extensão do nome original do arquivo enviado pelo cliente (`pathinfo($originalName, PATHINFO_EXTENSION)`) sem qualquer filtro, e grava o binário em `storage/app/public/bios/{id}/{nome}.{ext}`. `PlanGate::assertCanUpload()` só valida contagem e tamanho, nunca tipo de arquivo. O campo `mime` é apenas metadado salvo no banco — nunca é usado para bloquear o upload.
- **Impacto (o que afeta):** Qualquer usuário autenticado com uma bio (inclusive plano Free) pode enviar um arquivo `shell.php` (via multipart `file` ou via payload JSON base64 com `name: "shell.php"`) que é salvo em `storage/app/public/bios/{bio_id}/shell-xxxxxx.php`. Esse diretório é exposto publicamente via `public/storage` → symlink para `storage/app/public` (confirmado em `bin/deploy.sh:33-35`, que recria o symlink em produção). O projeto roda em hospedagem compartilhada HostGator com Apache/mod_php e `public/.htaccess` padrão do Laravel (sem regra que desabilite execução de PHP dentro de `storage/`), portanto o arquivo é executado como PHP ao ser acessado via `https://<slug>.dominio/storage/bios/{id}/shell-xxxxxx.php` — execução remota de código arbitrário no servidor, com acesso a `.env`, banco de dados e todas as bios de todos os clientes.
- **Evidência:**
```php
// app/Services/MediaStorageService.php
public function store(Bio $bio, string $originalName, string $binary): string
{
    $safe = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) ?: 'arquivo';
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION) ?: 'bin');
    $name = $safe.'-'.Str::lower(Str::random(6)).'.'.$ext;
    $path = 'bios/'.$bio->id.'/'.$name;
    Storage::disk('public')->put($path, $binary);
    return $path;
}
```
- **Solução proposta:** Em `MediaPayloadDecoder`/`UploadMedia`, validar o conteúdo real do arquivo (não a extensão informada pelo cliente) com `finfo`/`Symfony\Mime\MimeTypes` contra uma allow-list fechada (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, opcionalmente `image/svg+xml` só se sanitizado). Rejeitar qualquer arquivo cujo MIME detectado não esteja na lista, independente do nome/extensão enviados. Em `MediaStorageService::store`, gerar a extensão a partir do MIME detectado (mapa fixo mime→extensão), nunca a partir de `PATHINFO_EXTENSION` do nome do cliente. Como defesa em profundidade, adicionar um `storage/app/public/.htaccess` (ou equivalente) com `php_flag engine off` / `<FilesMatch "\.(php|phtml|phar)$"> Require all denied </FilesMatch>` e replicar isso no `bin/deploy.sh` para o `WEB_ROOT/storage`.

## Bug #2 — Impersonação de admin não tem saída: `stop-impersonating` fica preso atrás do middleware `admin`
- **Severidade:** Alto
- **Categoria:** Correção
- **Local:** `routes/admin.php:6-11`, `app/Http/Middleware/EnsureAdmin.php:17-25`, `app/UseCases/Admin/ImpersonateUser.php:15-29`, `app/UseCases/Admin/StopImpersonating.php`
- **Descrição:** `POST /api/admin/stop-impersonating` está registrado dentro do grupo `Route::middleware(['auth', 'verified', 'admin'])`. Quando um admin impersona um usuário (`ImpersonateUser::execute`), ele faz `Auth::login($bio->user)` — a partir desse ponto o usuário autenticado na sessão é o dono da bio (não-admin). Qualquer chamada subsequente a `/api/admin/stop-impersonating` passa pelo middleware `EnsureAdmin`, que checa `$user->is_admin` do usuário **atual** (o impersonado) e retorna 403, bloqueando a própria rota que deveria reverter a impersonação.
- **Impacto (o que afeta):** Não existe caminho funcional para o admin sair da conta impersonada via API. Além disso, o front-end (`resources/js/admin/`) nunca chama esse endpoint — não há botão/UI de "voltar para admin" nem exposição de `impersonating` no payload de sessão (`SessionPresenter::for()` não inclui essa informação). Na prática, a feature de impersonação (usada para suporte/debug em conta de cliente) é uma via de mão única: o admin só consegue voltar limpando cookies/sessão manualmente.
- **Evidência:**
```php
// routes/admin.php
Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    ...
    Route::post('/api/admin/stop-impersonating', [AdminController::class, 'stopImpersonating']);
});
// app/Http/Middleware/EnsureAdmin.php
if (! $user || ! $user->is_admin) { abort(403, 'Acesso restrito.'); }
```
- **Solução proposta:** Mover `/api/admin/stop-impersonating` para fora do grupo `admin` (basta `auth`+`verified`), e no `StopImpersonentando`/`EnsureAdmin` decidir a autorização a partir de `session('impersonator_id')` em vez do `is_admin` do usuário atual. Adicionar no `SessionPresenter::for()` um campo `impersonating: bool` e no front-end um banner fixo com botão "Voltar para admin" enquanto essa flag estiver ativa.

## Bug #3 — Login e cadastro sem rate limiting (brute force / credential stuffing)
- **Severidade:** Alto
- **Categoria:** Segurança
- **Local:** `routes/web.php:14-19`
- **Descrição:** As rotas `POST /login` e `POST /cadastro` estão registradas apenas sob o middleware `guest`, sem nenhum `throttle`. Diferente do padrão Laravel Breeze/Fortify (que aplica `throttle:login`, tipicamente 5 tentativas), aqui não há limite de tentativas por IP/e-mail.
- **Impacto (o que afeta):** Um atacante pode tentar senhas ilimitadas contra qualquer e-mail cadastrado (`LoginUser::execute` usa `Auth::attempt` sem lockout) ou automatizar criação de milhares de contas via `/cadastro`. Combinado com `unique:users,email` em `RegisterRequest`, também permite enumeração de e-mails cadastrados em escala (a resposta de validação indica se o e-mail já existe).
- **Evidência:**
```php
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/cadastro', [RegisterController::class, 'create'])->name('register');
    Route::post('/cadastro', [RegisterController::class, 'store']);
    ...
});
```
- **Solução proposta:** Aplicar `throttle:6,1` (ou usar `RateLimiter::for('login', ...)` combinando e-mail+IP, como o Fortify faz) nas rotas POST de `/login` e `/cadastro`. Para login, considerar lockout progressivo por e-mail (ex.: `Illuminate\Cache\RateLimiter` chaveado por `email|ip`) para não depender só do throttle por IP.

## Bug #4 — `/api/analytics/track` é público, sem throttle e sem validação de payload
- **Severidade:** Alto
- **Categoria:** Confiabilidade / Segurança
- **Local:** `routes/bio.php:20`, `app/Http/Controllers/AnalyticsController.php:20-24`, `app/UseCases/Analytics/TrackEvent.php:24-60`
- **Descrição:** Ao contrário dos outros endpoints públicos do mesmo arquivo de rotas (`/api/public/forms/submit` com `throttle:20,1`, `/api/public/forms/{formSlug}` com `throttle:60,1`), a rota `POST /api/analytics/track` não tem middleware de throttle nem passa por um `FormRequest`. O payload chega direto do `AnalyticsPayloadDecoder` (JSON cru ou `$request->all()`) até `TrackEvent::execute()`, que grava em `analytics_events` sem validar tipos/tamanhos: `occurred_at` vai direto para `Carbon::parse()` com string arbitrária do cliente, `item_index` (coluna `unsignedSmallInteger`) e campos com limite de tamanho (`label` varchar 160, `target_url` varchar 1024, `path`) não são validados antes do insert.
- **Impacto (o que afeta):** (a) Qualquer visitante anônimo pode inundar a tabela `analytics_events` com requisições ilimitadas (sem throttle), distorcendo métricas do dono da bio e crescendo o banco indefinidamente — vetor de DoS/custo de armazenamento barato de explorar. (b) Um payload malformado (ex.: `occurred_at: "não-é-data"`, `item_index` como string longa/array) pode disparar exceção não tratada dentro do UseCase (`Carbon::parse` lança `InvalidArgumentException` para strings não reconhecíveis) ou erro de banco (truncamento/overflow em modo estrito), resultando em 500 para o visitante e, dependendo da config de log, ruído/possível vazamento de stacktrace se `APP_DEBUG` estiver ligado em produção por engano.
- **Evidência:**
```php
// routes/bio.php
Route::post('/api/analytics/track', [AnalyticsController::class, 'track']);
// sem throttle, diferente de:
Route::post('/api/public/forms/submit', [FormController::class, 'submit'])->middleware('throttle:20,1');
```
```php
// TrackEvent::execute
'occurred_at' => isset($payload['occurred_at']) ? Carbon::parse($payload['occurred_at']) : now(),
```
- **Solução proposta:** Criar um `TrackEventRequest` (FormRequest) validando `analytics_key` (string, max 64), `event_type` (in: pageview,click), `occurred_at` (nullable, date), `meta.item_index` (nullable, integer, min:0, max:65535), `meta.label`/`path`/`referrer`/`target_url` (string, max coerente com a coluna). Envolver o `Carbon::parse` em try/catch com fallback para `now()`. Adicionar `->middleware('throttle:120,1')` (por IP) na rota, no mesmo padrão dos outros endpoints públicos.

## Bug #5 — Webhook do Mercado Pago sem verificação de assinatura e sem rate limit
- **Severidade:** Médio
- **Categoria:** Segurança
- **Local:** `app/Http/Controllers/BillingController.php:41-46`, `app/Services/MercadoPagoService.php:181-198`
- **Descrição:** `POST /webhooks/mercadopago` é público (fora de `auth`), isento de CSRF (`bootstrap/app.php:30`) e não valida o header `x-signature`/`x-request-id` que o Mercado Pago envia para autenticar notificações. Qualquer request externo com `{"type": "preapproval", "data": {"id": "<qualquer-id>"}}` é aceito e processado.
- **Impacto (o que afeta):** O impacto direto de upgrade/downgrade de plano é mitigado porque `syncPreapproval`/`syncPayment` buscam o estado real na API do Mercado Pago (não confiam no corpo do webhook para decidir status) — por isso não classifiquei como Alto. Ainda assim, um atacante pode: (a) forçar a aplicação a fazer chamadas HTTP de saída ilimitadas para `api.mercadopago.com` sem controle de taxa, gerando custo/latência e possível rate-limit da própria conta MP; (b) descobrir, por tentativa e erro/timing, se um `preapproval_id`/`payment_id` de terceiro existe (a resposta muda entre "processado" e "ignorado por token ausente").
- **Evidência:**
```php
public function webhook(Request $request, HandleMercadoPagoWebhook $useCase): JsonResponse
{
    $useCase->execute($request->all()); // sem checar assinatura
    return response()->json(['ok' => true]);
}
```
- **Solução proposta:** Validar o header `x-signature` do Mercado Pago (HMAC com o webhook secret da conta) antes de processar, retornando 401 se inválido. Adicionar `throttle:30,1` na rota do webhook.

## Bug #6 — Suspensão de bio não bloqueia upload de mídia, páginas internas, formulários nem leads
- **Severidade:** Médio
- **Categoria:** Correção / Segurança
- **Local:** `app/UseCases/Media/UploadMedia.php:29`, `app/UseCases/Media/ListMedia.php`, `app/UseCases/Media/DeleteMedia.php:22`, `app/UseCases/BioPage/*.php`, `app/UseCases/BioForm/*.php`, `app/UseCases/Leads/*.php` (todos usam `CurrentBioService::require`, nenhum usa `requireActive`)
- **Descrição:** Apenas `SaveBioDraft`, `PublishBio`, `RevertBioDraft`, `RestoreBioBackup`, `LoadEditorBio` e `GetBioPaths` chamam `CurrentBioService::requireActive()` (que bloqueia bio com `status = suspended`). Todos os demais UseCases autenticados das features novas (mídia, páginas internas, formulários, leads) usam `require()`, que não verifica `isActive()`.
- **Impacto (o que afeta):** Quando um admin suspende uma bio (`PATCH /api/admin/bios/{bio}` com `status: suspended` — usado para conter abuso/ToS), o dono continua conseguindo: enviar arquivos (consumindo cota de storage do plano, inclusive explorável junto com o Bug #1), criar/editar/publicar páginas internas e formulários, e gerenciar leads — mesmo que a bio pública em si já retorne 403 (via `PublicBioPresenter::published`). A suspensão fica inconsistente: bloqueia a vitrine pública mas não o backend de conteúdo do usuário suspenso.
- **Solução proposta:** Trocar `require()` por `requireActive()` nos UseCases de Media, BioPage, BioForm e Lead que representam escrita (`Upload`, `Delete`, `Create*`, `Save*Draft`, `Publish*`), mantendo `require()` (sem checar status) apenas em leituras que o dono precisa acessar mesmo suspenso (ex.: `ListLeads`, `GetFormSubmissions`, para ele conseguir exportar dados antes de reativar).

## Bug #7 — Onboarding permite criar duas bios para o mesmo usuário em corrida (double-submit)
- **Severidade:** Médio
- **Categoria:** Correção
- **Local:** `app/UseCases/Onboarding/CompleteOnboarding.php:20-23`, `database/migrations/2026_08_12_000002_create_bios_table.php`
- **Descrição:** `CompleteOnboarding::execute` verifica `$this->bios->existsForUser($user)` e só then cria a bio. Não há transação nem lock, e a tabela `bios` não tem constraint `unique` em `user_id` (só em `slug` e `analytics_key`). Duas requisições simultâneas de onboarding do mesmo usuário (ex.: duplo clique, ou re-envio automático de formulário) podem passar ambas pela checagem `existsForUser` antes que qualquer uma tenha persistido, criando duas linhas em `bios` para o mesmo `user_id`.
- **Impacto (o que afeta):** `User::bio()` é `hasOne`, então o app só nunca mostra/edita uma das duas bios criadas — a outra fica órfã no banco, consumindo um slug válido permanentemente sem que o usuário consiga vê-la, editá-la ou liberá-la.
- **Solução proposta:** Adicionar `$table->unique('user_id')` na tabela `bios` (nova migration) e envolver a criação em `DB::transaction` com tratamento do `QueryException` de violação de unicidade, convertendo para a mesma `ApplicationException('Você já tem uma bio.', 422)` já usada no caminho feliz.

## Bug #8 — `CreateCheckout` repassa mensagem de exceção interna do Mercado Pago ao cliente
- **Severidade:** Baixo
- **Categoria:** Segurança / Qualidade
- **Local:** `app/UseCases/Billing/CreateCheckout.php:26-29`
- **Descrição:** Qualquer `Throwable` lançado por `MercadoPagoService::createCheckout` (SDK, HTTP, `RuntimeException` de configuração) é recapturado e sua `getMessage()` é devolvida crua no corpo JSON 422 da resposta ao usuário final.
- **Impacto (o que afeta):** Mensagens de erro de SDK/HTTP de terceiros (que podem incluir detalhes de configuração, payloads ou erros de infraestrutura) vazam para o cliente do app, em vez de uma mensagem genérica; dificulta também auditoria porque a mensagem real não fica padronizada em log com contexto.
- **Evidência:**
```php
} catch (Throwable $e) {
    throw new ApplicationException($e->getMessage(), 422);
}
```
- **Solução proposta:** Logar `$e` com `Log::error()` incluindo contexto (bio_id, driver) e lançar `ApplicationException` com mensagem genérica fixa ("Não foi possível iniciar o checkout. Tente novamente."), preservando o detalhe técnico apenas nos logs.

## Bug #9 — Sem limite de plano para páginas internas e formulários no Free
- **Severidade:** Baixo
- **Categoria:** Qualidade
- **Local:** `config/linksnabio.php:16-33`, `app/UseCases/BioPage/CreateBioPage.php`, `app/UseCases/BioForm/CreateBioForm.php`
- **Descrição:** `PlanGate` define limites para links, imagens, domínio próprio e templates, mas não há nenhuma checagem de limite para número de páginas internas ou formulários por bio. `CreateBioPage`/`CreateBioForm` só validam slug único, sem consultar `PlanGate`.
- **Impacto (o que afeta):** Um usuário Free pode criar um número ilimitado de páginas internas e formulários, o que contradiz o modelo de negócio Free/Pro já aplicado ao resto do produto e foi explicitamente sinalizado como pendência no próprio roadmap (`docs/roadmap/2026-08-14-formularios-paginas-funil.md`, seção "Depois das 9 fases"). Não é regressão acidental, mas é uma lacuna que deveria entrar no roadmap de melhorias antes de divulgar a feature.
- **Solução proposta:** Adicionar `max_bio_pages`/`max_bio_forms` em `config/linksnabio.php` por plano e um `PlanGate::assertCanCreatePage()`/`assertCanCreateForm()` chamado em `CreateBioPage`/`CreateBioForm`.

## Bug #10 — Resposta de formulário não valida campos obrigatórios no servidor
- **Severidade:** Baixo
- **Categoria:** Confiabilidade
- **Local:** `app/UseCases/Forms/SubmitFormResponse.php:1120-1163`, `app/Http/Requests/SubmitFormRequest.php`
- **Descrição:** A validação de `required` dos campos do formulário (`FormField.required`) só acontece no cliente (`resources/js/bio/components/FormModal.tsx:59-64`). O backend (`SubmitFormRequest`/`SubmitFormResponse`) aceita `answers` como qualquer array de strings, sem checar contra a definição publicada do formulário (`bio_forms.json_published.fields` ou o bloco `form` da bio) se os campos marcados como obrigatórios foram de fato preenchidos.
- **Impacto (o que afeta):** Qualquer requisição direta a `POST /api/public/forms/submit` (fora do fluxo da UI) grava submissões vazias ou parciais, poluindo a tela de respostas do dono da bio e o funil de leads (que depende dessas respostas para extrair nome/contato em `CreateLeadFromFormSubmission`).
- **Solução proposta:** Em `SubmitFormResponse::execute`, antes de persistir, carregar a definição publicada do formulário (mesma lógica já usada em `CreateLeadFromFormSubmission::resolveFormFields`) e rejeitar (422) se algum campo `required` estiver ausente/vazio em `answers`.

## Notas / Falsos positivos descartados
- **`ShowPublicBio` não checar `isActive()` diretamente:** investigado como possível bug (bio suspensa continuar acessível publicamente), mas `PublicBioPresenter::published()` — chamado por `ResolveHomePage::viewData()` dentro do mesmo fluxo — já lança 403 para bio inativa. Suspensão funciona corretamente para a página pública.
- **`AnalyticsPayloadDecoder::fromRequest` com condição aparentemente invertida (`$raw !== '' && ! $request->isJson()`):** parecia bug à primeira vista, mas é o comportamento correto — cobre o caso de `navigator.sendBeacon` (usado tipicamente para tracking), que envia `Content-Type: text/plain` por padrão; para requisições `application/json` de verdade, `Request::all()` já lê do corpo JSON automaticamente via Symfony/Laravel.
- **Race condition de slug em `CreateBioPage`/`CreateBioForm`/`CompleteOnboarding` (check-then-create):** existe constraint `unique` no banco para `slug` (`bio_pages`, `bio_forms`, `bios`), então a pior consequência de uma corrida é um erro 500 genérico na requisição perdedora, não duplicidade de dados — bug real de robustez (mensagem de erro ruim), mas não incluído como item separado por já estar coberto pelo espírito do Bug #7 (que trata do caso sem proteção de unicidade nenhuma, mais grave).
