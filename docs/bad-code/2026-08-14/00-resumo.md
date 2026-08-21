# Relatório de Qualidade de Código — 2026-08-14

## Resumo geral
- Total de achados: 17
- Críticos: 2 · Altos: 6 · Médios: 7 · Baixos: 2
- Áreas avaliadas: backend PHP (`app/Http/Controllers`, `app/UseCases`, `app/Services`, `app/Repositories`), frontend React (`resources/js/editor`, `resources/js/bio`, `resources/js/app`, `resources/js/admin`), pipeline (`.github/workflows`, `Makefile`, `phpunit.xml`, `tsconfig.json`)

## Contexto da auditoria
O projeto é um monorepo Laravel 11 (PHP) + React 19/Vite (front), não o layout genérico `bio/editor/panel/site` de outros projetos — a arquitetura real e documentada no `README.md` é `Controller → UseCase → Service/Repository`. Essa arquitetura é seguida de forma consistente pelos 20 controllers (nenhum acessa Eloquent diretamente), o que é um ponto forte do projeto. Os achados abaixo são exceções pontuais a esse padrão, mais lacunas de teste/tipagem que, no tamanho atual do código, ainda são baratas de corrigir — e ficam caras se o projeto crescer sem correção.

## Arquivos deste relatório
- [01-typescript-e-build.md](01-typescript-e-build.md) — 4 achados — erros de TypeScript já presentes no repo e por que o CI/build não os pega, apesar de `strict: true`.
- [02-testes-automatizados.md](02-testes-automatizados.md) — 3 achados — cobertura de teste quase inexistente (backend e zero no front) frente ao checklist de PR que a exige.
- [03-backend-usecases-arquitetura.md](03-backend-usecases-arquitetura.md) — 4 achados — inconsistências entre `UseCases/BioPage` e `UseCases/BioForm` (módulos irmãos) e no uso de `PlanGate`/`CurrentBioService`.
- [04-frontend-duplicacao-e-codigo-morto.md](04-frontend-duplicacao-e-codigo-morto.md) — 3 achados — hooks e painéis de Páginas/Formulários praticamente duplicados, e um export morto.
- [05-editorapp-god-component.md](05-editorapp-god-component.md) — 3 achados — `EditorApp.tsx` (1185 linhas, 24 `useState`) concentrando orquestração, histórico e chamadas de API.

## Ordem de refatoração sugerida
1. **01-typescript-e-build.md** — são correções pontuais de 1-3 linhas cada, sem risco, e habilitam uma rede de segurança (`tsc --noEmit` no CI) antes de qualquer refactor maior.
2. **02-testes-automatizados.md** — adicionar testes é aditivo (não toca em código existente) e destrava os refactors dos itens 3-5 com uma rede de segurança real.
3. **03-backend-usecases-arquitetura.md** — mudanças isoladas por UseCase (extrair trait, alinhar chamadas de `PlanGate`/`CurrentBioService`), cada uma testável independentemente.
4. **04-frontend-duplicacao-e-codigo-morto.md** — unificar hooks/painéis de Páginas e Formulários; depende de ter testes/tipos “verdes” primeiro para não mascarar regressões.
5. **05-editorapp-god-component.md** — a refatoração mais ampla (quebrar `EditorApp.tsx`); deixada por último porque se apoia nos hooks já padronizados no item 4 e na rede de segurança dos itens 1-2.
