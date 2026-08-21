# Qualidade de Código — UseCases e serviços do backend (2026-08-14)

Parte 03 de 05 · [Voltar ao resumo](00-resumo.md)

## Achado #1 — `BioPage` duplica a serialização que `BioForm` já extraiu para uma trait
- **Severidade:** Alto
- **Categoria:** Duplicação / Desvio de arquitetura
- **Local:** `app/UseCases/BioPage/ListBioPages.php:38-50`, `app/UseCases/BioPage/CreateBioPage.php:48-57`, `app/UseCases/BioPage/PublishBioPage.php:37-46`, `app/UseCases/BioPage/SaveBioPageDraft.php:37-46` (todas repetem o mesmo array literal) vs. `app/UseCases/BioForm/SerializesBioForm.php:1-27` (trait `toArray()` usada por `ListBioForms`, `PublishBioForm`, etc.)
- **Problema encontrado:** `BioForm` e `BioPage` são módulos irmãos (CRUD de sub-recursos da bio, mesma forma: `id/slug/title/status/json_draft/json_published/created_at/updated_at`). No namespace `BioForm`, esse array de serialização foi corretamente extraído para a trait `SerializesBioForm` (`app/UseCases/BioForm/SerializesBioForm.php`) e reutilizado em pelo menos `ListBioForms` e `PublishBioForm`. No namespace `BioPage`, o mesmo array de 8 campos é copiado literalmente em **4 arquivos diferentes** (`ListBioPages.php:41-48`, `CreateBioPage.php:49-56`, `PublishBioPage.php:38-45`, `SaveBioPageDraft.php:38-45`), sem trait nenhuma.
- **Por que isso é um problema:** é o padrão do próprio projeto sendo seguido em um lugar e ignorado no outro equivalente. Se o formato de resposta de página/formulário precisar mudar (ex.: adicionar um campo `updated_by`), quem mexer em `BioForm` muda 1 lugar; quem mexer em `BioPage` precisa lembrar de mudar os 4 — divergência silenciosa é questão de tempo.
- **Evidência:**
  ```php
  // app/UseCases/BioPage/ListBioPages.php:38-50 (idêntico, com "page" trocado por "form",
  // ao que já existe em app/UseCases/BioForm/SerializesBioForm.php:12-23)
  private function toArray(BioPage $page): array
  {
      return [
          'id' => $page->id,
          'slug' => $page->slug,
          'title' => $page->title,
          'status' => $page->status,
          'json_draft' => $page->json_draft,
          'json_published' => $page->json_published,
          'created_at' => $page->created_at?->toIso8601String(),
          'updated_at' => $page->updated_at?->toIso8601String(),
      ];
  }
  ```
- **Refatoração sugerida:**
  1. Criar `app/UseCases/BioPage/SerializesBioPage.php` (mesmo formato de `SerializesBioForm`), com um único método `toArray(BioPage $page): array`.
  2. Em `ListBioPages.php`, `CreateBioPage.php`, `PublishBioPage.php` e `SaveBioPageDraft.php`: adicionar `use SerializesBioPage;` e trocar o array inline pela chamada a `$this->toArray($page)`, removendo o método privado duplicado de `ListBioPages.php:38-50`.
  3. Passo isolado e de baixo risco: não muda o formato de saída da API, só remove duplicação — pode ser feito e testado (ver achado #1 de `02-testes-automatizados.md`) arquivo por arquivo.

## Achado #2 — `PlanGate` não é aplicado a Páginas e Formulários, só à bio principal
- **Severidade:** Alto
- **Categoria:** Desvio de arquitetura
- **Local:** `app/Services/PlanGate.php:29-46` (`assertCanSave`, que checa `max_links` e `templates`) chamado apenas em `app/UseCases/Bio/SaveBioDraft.php:27` e `app/UseCases/Bio/PublishBio.php:27`; **não** é chamado em `app/UseCases/BioPage/SaveBioPageDraft.php`, `app/UseCases/BioPage/PublishBioPage.php`, `app/UseCases/BioForm/SaveBioFormDraft.php` ou `app/UseCases/BioForm/PublishBioForm.php`. Config de planos em `config/linksnabio.php:18-35` não define nenhum limite de quantidade de páginas ou formulários.
- **Problema encontrado:** `PlanGate` é descrito no `README.md` como o serviço responsável pelas "regras e limites dos planos" e `PlanGate::countLinks()` (`app/Services/PlanGate.php:88-105`) já sabe contar links dentro de `sections[].items[]` — exatamente a mesma estrutura usada pelo `json_draft` de uma `BioPage` (`app/UseCases/BioPage/SaveBioPageDraft.php:32-35` grava `['sections' => $sections]`). Mas `SaveBioPageDraft::execute()` (linhas 24-35) só faz `is_array($sections)`/`array_is_list`, sem chamar `PlanGate`. O mesmo vale para `BioForm` e para a criação de páginas/formulários em si — não há nenhum limite de quantidade (`CreateBioPage.php` e `CreateBioForm.php` não consultam `PlanGate::limits()`).
- **Por que isso é um problema:** cria duas regras de negócio divergentes fazendo a mesma coisa (limitar links por plano) em lugares diferentes: uma aplicada (bio principal), outra não (páginas internas e formulários). Um usuário no plano Free pode ter no máximo 8 links na bio principal (`config/linksnabio.php:20`), mas pode criar quantas páginas internas quiser, cada uma com quantos links quiser — o limite documentado como regra do plano não é, na prática, um limite real. Isso não é um "bug de segurança" (fora do escopo desta auditoria) — é a mesma fonte de verdade (`PlanGate`) que deveria decidir isso e não está sendo consultada, o que é uma inconsistência de arquitetura que tende a gerar side-effects ("por que free consegue burlar o limite de links usando páginas?") difíceis de rastrear depois.
- **Evidência:**
  ```php
  // app/Services/PlanGate.php:29-46 — só chamado por Bio/SaveBioDraft e Bio/PublishBio
  public function assertCanSave(Bio $bio, array $config): void { ... }

  // app/UseCases/BioPage/SaveBioPageDraft.php:24-35 — grava sections sem consultar PlanGate
  public function execute(User $user, string $slug, array $payload): array
  {
      $bio = $this->currentBio->require($user);
      $page = $this->pages->findBySlug($bio, $slug);
      ...
      $sections = $this->extractSections($payload);
      $page = $this->pages->update($page, ['json_draft' => ['sections' => $sections]]);
  ```
- **Refatoração sugerida (passos incrementais, aplicáveis um de cada vez):**
  1. Decidir a regra de produto primeiro (fora do escopo desta auditoria de código): páginas/formulários devem contar para `max_links`? Deve haver um `max_pages`/`max_forms` em `config/linksnabio.php:18-35`? Esse relatório só aponta a inconsistência técnica, não decide a regra.
  2. Uma vez decidida a regra, extrair de `PlanGate::assertCanSave` a contagem de links (`countLinks`, já existe e é reutilizável) para validar também o payload de `SaveBioPageDraft`/`SaveBioFormDraft`, injetando `PlanGate` no construtor desses UseCases (mesmo padrão já usado em `Bio/SaveBioDraft.php`).
  3. Se o produto decidir por um limite de quantidade de páginas/formulários, adicionar `max_pages`/`max_forms` em `config/linksnabio.php:18-35` e um novo método `PlanGate::assertCanCreatePage()`/`assertCanCreateForm()`, chamado em `CreateBioPage.php:27` e `CreateBioForm.php` antes do `$this->pages->create(...)`.

## Achado #3 — `CurrentBioService::require()` vs `requireActive()` aplicado sem critério consistente
- **Severidade:** Médio
- **Categoria:** Desvio de arquitetura / Documentação
- **Local:** `app/Services/CurrentBioService.php:20-38` (define os dois métodos); `requireActive()` só é usado em `app/UseCases/Bio/{SaveBioDraft,PublishBio,RevertBioDraft,RestoreBioBackup,LoadEditorBio,GetBioPaths}.php`; todos os outros ~24 UseCases que dependem de `CurrentBioService` (BioPage, BioForm, Media, Domain, Leads, Billing, Analytics — ver lista completa rodando `grep -rn "currentBio->require(" app/UseCases`) usam `require()`, que não checa `isActive()`.
- **Problema encontrado:** o próprio `CurrentBioService.php:32-38` documenta que `requireActive()` existe para impedir acesso a "bio suspensa" (status inativo), com exceção para admins. Mas essa checagem só protege os 6 UseCases relacionados à bio principal — criar/editar página interna, criar/editar formulário, fazer upload de mídia, configurar domínio próprio, gerenciar leads e ver billing continuam funcionando mesmo com a bio suspensa, porque usam `require()` puro. Não há nenhum comentário ou decisão documentada (`docs/roadmap` ou docblock) explicando por que só o fluxo de bio principal precisa da checagem de "ativa".
- **Por que isso é um problema:** sem uma regra explícita de "quando usar qual", cada UseCase novo tem 50% de chance de escolher o método errado por analogia com o UseCase vizinho mais recente (que também pode estar "errado"). É o tipo de inconsistência que não quebra nada hoje, mas em revisão de código futura ninguém consegue dizer com confiança se é intencional.
- **Evidência:**
  ```php
  // app/Services/CurrentBioService.php:32-38
  /**
   * Bio ativa do usuário. Admins podem acessar bios suspensas.
   */
  public function requireActive(User $user): Bio { ... }
  ```
  ```
  $ grep -rn "currentBio->requireActive" app/UseCases | wc -l
  6
  $ grep -rn "currentBio->require(" app/UseCases | wc -l
  24
  ```
- **Refatoração sugerida:**
  1. Adicionar ao docblock de `CurrentBioService::require()` (linha ~19) e `requireActive()` (linha ~32) uma frase explícita de critério — ex.: "use `requireActive` para qualquer escrita que afete o que o visitante vê publicado; use `require` para leitura/gestão interna que não precisa bloquear bio suspensa" (ou o critério real que o time decidir).
  2. Com o critério documentado, revisar os 24 usos de `require()` um a um (podem ser PRs pequenos por módulo: BioPage, depois BioForm, depois Media...) e trocar por `requireActive()` onde o critério indicar — cada troca é uma linha e testável isoladamente.

## Achado #4 — Ausência de `declare(strict_types=1)` em todo o backend
- **Severidade:** Baixo
- **Categoria:** Boas práticas PHP
- **Local:** todos os 143 arquivos de `app/*.php` (nenhum tem a declaração)
- **Problema encontrado:** o projeto já investe pesado em tipagem via PHPDoc (`@param array<string, mixed>`, `@return list<...>` presentes na maioria dos UseCases/Repositories) e roda PHPStan nível 5 (`phpstan.neon:3`). Apesar disso, nenhum arquivo declara `strict_types=1`, então comparações e coerções de tipo em tempo de execução (ex.: um `int` sendo aceito onde só `string` é esperado) não são pegas pelo PHP em runtime, só pela análise estática do PHPStan — que roda num nível moderado (5 de 9 possíveis).
- **Por que isso é um problema:** é uma ausência consistente (não há inconsistência entre arquivos), então não é uma violação de padrão interno — é uma oportunidade de reforçar um padrão que o projeto já demonstra valorizar (tipagem rica). Por isso a severidade é baixa: não há risco de dessincronia, é só uma prática que falta.
- **Evidência:**
  ```
  $ grep -rl "declare(strict_types=1)" app --include="*.php" | wc -l
  0
  ```
- **Refatoração sugerida:**
  1. Não é necessário migrar tudo de uma vez: adicionar `declare(strict_types=1);` logo após `<?php` em arquivos novos a partir de agora (via revisão de PR) e, oportunisticamente, nos arquivos tocados pelos achados #1-#3 deste relatório.
  2. Se quiser formalizar, considerar subir o nível do PHPStan (`phpstan.neon:3`, hoje `level: 5`) em um passo por vez (6, depois 7...) — cada subida de nível tende a revelar poucos pontos por vez num projeto deste tamanho (~7 mil linhas em `app/`).
