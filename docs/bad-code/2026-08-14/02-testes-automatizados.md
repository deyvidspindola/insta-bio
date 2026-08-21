# Qualidade de Código — Testes automatizados (2026-08-14)

Parte 02 de 05 · [Voltar ao resumo](00-resumo.md)

## Achado #1 — Cobertura de teste quase inexistente frente ao tamanho do domínio
- **Severidade:** Crítico
- **Categoria:** Documentação / Boas práticas (ausência de rede de segurança)
- **Local:** `tests/Feature/*.php`, `tests/Unit/*.php` vs. `app/UseCases/**/*.php`; `package.json:2-5` (sem script de teste front-end)
- **Problema encontrado:** o backend tem 65 classes de `UseCase` (contadas em `app/UseCases`) e apenas **13 métodos de teste** no total, concentrados em `AuthTest` (2), `BioApiTest` (8), `HealthTest` (2) e `PlanAndSlugTest` (2). Módulos inteiros não têm nenhum teste: `BioForm` (5 UseCases), `BioPage` (5), `Leads` (5), `Media` (3), `Domain` (4), `Billing` (4), `Platform` (3), `Maps` (1), `Admin` (4, exceto suspensão coberta indiretamente em `BioApiTest.php:116`). No front-end não há nenhum framework de teste instalado (`package.json` só tem `build`/`dev` em `scripts`, sem Vitest/Jest, sem um único arquivo `*.test.ts(x)` no repo).
- **Por que isso é um problema:** os módulos sem teste (Leads, Forms, Pages, Domain, Billing) são justamente os mais recentes e com regra de negócio mais específica (heurísticas, integração com Mercado Pago, gate de plano). Qualquer refatoração nessas áreas — inclusive as sugeridas nos arquivos `03`, `04` e `05` deste relatório — não tem como ser validada automaticamente hoje; a validação depende inteiramente de teste manual.
- **Evidência:**
  ```
  $ grep -rn "public function test" tests/ | wc -l
  13
  $ find app/UseCases -name "*.php" | wc -l
  65
  ```
- **Refatoração sugerida (incremental, sem exigir 100% de cobertura de uma vez):**
  1. Priorizar teste de feature para os fluxos com regra de negócio mais arriscada primeiro: `BioForm`/`BioPage` (create/save/publish/delete) e `Leads` (criação a partir de submissão), replicando o estilo já usado em `tests/Feature/BioApiTest.php`.
  2. Para o front, instalar Vitest (já compatível com Vite, sem mudar o bundler) e cobrir primeiro os hooks puros de lógica (`useBioForms`, `useBioPages`, `useBioForms`/`useBioPages` depois de unificados — ver `04-frontend-duplicacao-e-codigo-morto.md`), que não dependem de DOM.
  3. Adicionar `"test": "vitest run"` em `package.json` e um step correspondente no job `tests` (ou um novo job) do CI.

## Achado #2 — Heurística de extração de nome/e-mail/telefone sem nenhum teste
- **Severidade:** Médio
- **Categoria:** Documentação / Organização
- **Local:** `app/UseCases/Leads/CreateLeadFromFormSubmission.php:38-107` (método `extractNameAndContact`) e `:114-158` (`resolveFormFields`)
- **Problema encontrado:** é a UseCase mais longa do projeto (188 linhas) e a única com lógica de heurística real (inferir campo de nome/e-mail/telefone por `type`, por palavras no `label`, e por fallback nas chaves das respostas). O comentário na linha 34 (`/** Heurística: type email/phone ou label com nome/e-mail/telefone. */`) explica o quê, mas não o porquê das regras de prioridade (ex.: por que o fallback de linha 83-99 só roda quando os três campos vêm `null`), e não há nenhum teste (nem em `tests/Feature`, nem em `tests/Unit`) cobrindo os casos de borda — campo duplicado, label em maiúsculas, respostas sem metadados de formulário.
- **Por que isso é um problema:** é lógica pura (sem I/O além de `$submission->bio`), perfeita para teste unitário rápido, mas qualquer ajuste futuro na heurística (ex.: suportar mais um tipo de campo) só pode ser validado rodando manualmente contra dados reais.
- **Evidência:** ver trecho citado acima; método com 6 ramos de decisão e nenhum `tests/Unit/*Lead*` correspondente (`find tests -iname "*lead*"` não retorna nada).
- **Refatoração sugerida:**
  1. Criar `tests/Unit/CreateLeadFromFormSubmissionTest.php` cobrindo pelo menos: (a) campo com `type=email` reconhecido direto; (b) campo `text` com label "Nome completo"; (c) fallback sem metadados de formulário; (d) resposta vazia não gera `contact`.
  2. Ao escrever os testes, aproveitar para transformar o comentário da linha 34 num bloco PHPDoc explicando a ordem de prioridade entre `type`, `label` e fallback — hoje só o "o quê" está documentado, não o "por quê" da ordem.

## Achado #3 — Checklist de PR exige teste de feature para UseCase novo, mas o processo não garante isso
- **Severidade:** Médio
- **Categoria:** Documentação
- **Local:** `.github/pull_request_template.md:20` (`- [ ] Caso de uso novo entrou com teste de feature`) vs. estado real descrito no achado #1
- **Problema encontrado:** o template de PR do próprio projeto já formaliza a expectativa de que todo UseCase novo venha com teste de feature, e também pede (linha 15) `make check` passando localmente — mas **não existe um alvo `check` no `Makefile`** (`Makefile` só tem `help, up, down, restart, build, logs, ps, fresh, sh, artisan, migrate, seed, test, pint, stan, tinker, mysql, mail`). Ou o checklist está referenciando uma ferramenta que nunca foi criada, ou foi removida sem atualizar o template.
- **Por que isso é um problema:** um checklist que menciona um comando inexistente treina a equipe (ou o próximo desenvolvedor) a ignorar o checklist como um todo, incluindo os itens que continuam válidos (teste de feature, ausência de regra de negócio em controller). É um ponto de atrito pequeno, mas symptomatic do gap real medido no achado #1.
- **Evidência:**
  ```
  # .github/pull_request_template.md:15
  - [ ] `make check` passou localmente
  ```
  ```
  $ grep -E '^[a-zA-Z_-]+:' Makefile
  help: down: restart: build: logs: ps: fresh: sh: artisan: migrate: seed: test: pint: stan: tinker: mysql: mail:
  ```
- **Refatoração sugerida:**
  1. Adicionar ao `Makefile` um alvo `check: pint stan test` (formatação + análise estática + testes, na ordem que falha mais rápido primeiro) para o comando do checklist existir de fato.
  2. Depois de fechar o achado #1 (Vitest no front), incluir também o `typecheck`/`test` do front nesse mesmo alvo `check`, mantendo um único comando local equivalente ao que o CI roda.
