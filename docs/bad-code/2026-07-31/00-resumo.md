# Relatório de Qualidade de Código — 2026-07-31

## Resumo geral
- Total de achados: 10
- Críticos: 0 · Altos: 4 · Médios: 4 · Baixos: 2
- Áreas avaliadas: bio / editor (React + PHP) / panel (React + PHP) / site / scripts

## Método

Investigação feita lendo o conteúdo integral de todos os arquivos citados (não apenas nomes/grep). Toda duplicação reportada foi confirmada comparando o texto real dos arquivos envolvidos; toda "quebra de padrão" foi confirmada olhando múltiplos arquivos-irmãos para identificar o padrão dominante do próprio repositório antes de apontar o desvio.

## Arquivos deste relatório

- [01-duplicacao-cross-package.md](01-duplicacao-cross-package.md) — 4 achados — Lógica de negócio (regra de bundle Vite, path do bio.json, guard de licença, tema claro/escuro) reimplementada de forma independente em `editor/`, `panel/` e `scripts/`, sem fonte única.
- [02-editor-php-endpoints.md](02-editor-php-endpoints.md) — 2 achados — Boilerplate de autenticação repetido em 8 endpoints do editor e `update-apply.php` quebrando o próprio padrão de extrair helpers para arquivos dedicados.
- [03-panel-php.md](03-panel-php.md) — 2 achados — `panel/php/lib/platform.php` acumulando responsabilidades demais e inconsistência no registro de exceções entre os endpoints `clients-*.php`.
- [04-editor-react.md](04-editor-react.md) — 1 achado — `AppearanceForm.tsx` quebrando o padrão de extração de campos em componentes pequenos já estabelecido em `item-editors/`.
- [05-bio-site.md](05-bio-site.md) — 1 achado — Interface `Hsv` morta em `bio/src/lib/colorEngine.ts`.

## Ordem de refatoração sugerida

1. **01-duplicacao-cross-package.md** — são as duplicações com maior risco de dessincronia silenciosa (regra de bundle Vite já reconhecida como duplicada em comentário do próprio código; guard de licença copiado manualmente no provisionamento de clientes). Corrigir aqui primeiro reduz o risco de qualquer mudança futura nesses fluxos esquecer uma das cópias.
2. **02-editor-php-endpoints.md** — depende parcialmente do achado #1 (o mesmo `update-apply.php`), mas o restante (boilerplate de auth) é isolado e de baixo risco para refatorar.
3. **03-panel-php.md** — reorganização de arquivo grande; melhor fazer depois que a duplicação de regra de bundle (usada dentro de `platform.php`) já estiver resolvida, para não reorganizar código que ainda vai mudar.
4. **04-editor-react.md** — refatoração de componente isolado, sem dependência dos itens acima.
5. **05-bio-site.md** — remoção de código morto, zero risco, pode ser feito a qualquer momento.
