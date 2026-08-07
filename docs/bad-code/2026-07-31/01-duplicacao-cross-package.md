# Qualidade de Código — Duplicação entre pacotes (2026-07-31)

Parte 1 de 5 · [Voltar ao resumo](00-resumo.md)

## Achado #1 — Regra "o que é um bundle Vite" reimplementada 3 vezes (PHP x2 + JS)

- **Severidade:** Alto
- **Categoria:** Duplicação
- **Local:**
  - `editor/php/update-apply.php:61-68` (`isBundleFile()`, `isEditorAssetBundle()`)
  - `panel/php/lib/platform.php:468-477` (`is_build_bundle_filename()`, `is_editor_asset_bundle_filename()`)
  - `scripts/lib/vite-bundles.mjs:8-17` (`VITE_BUNDLE_RE`, `isViteBundleFile()`, `isEditorAssetBundle()`)
- **Problema encontrado:** a mesma regra de negócio — "um arquivo `nome-HASH.js|css` é um bundle gerado pelo Vite e deve ser removido antes de copiar o build novo" — está implementada de forma independente em três arquivos, dois em PHP e um em JavaScript, com a **mesma regex** (`^[A-Za-z0-9][A-Za-z0-9._]*-[A-Za-z0-9_-]{6,}\.(js|css)$`) copiada literalmente:
  ```php
  // editor/php/update-apply.php:62
  function isBundleFile($name) {
      return preg_match('/^[A-Za-z0-9][A-Za-z0-9._]*-[A-Za-z0-9_-]{6,}\.(js|css)$/', $name) === 1;
  }
  ```
  ```php
  // panel/php/lib/platform.php:471
  return (bool) preg_match('/^[A-Za-z0-9][A-Za-z0-9._]*-[A-Za-z0-9_-]{6,}\.(js|css)$/', $name);
  ```
  ```js
  // scripts/lib/vite-bundles.mjs:8
  export const VITE_BUNDLE_RE = /^[A-Za-z0-9][A-Za-z0-9._]*-[A-Za-z0-9_-]{6,}\.(js|css)$/
  ```
  O próprio comentário em `update-apply.php:56` já reconhece o problema ("Funções auxiliares (espelham sync-clients-template.mjs)"), mas não há nenhum mecanismo (teste, script de verificação, geração automática) que impeça as três cópias de divergirem.
- **Por que isso é um problema:** o histórico do próprio arquivo já registra uma correção motivada por essa duplicação — o comentário em `update-apply.php:141-143` explica que a lista de arquivos de gate foi generalizada "senão o update-apply antigo pula arquivos novos como analytics-track.php", ou seja, uma das três cópias já ficou desatualizada em produção. Se o esquema de hash do Vite mudar (ex.: build tool trocado, ou hash mais curto/longo), é preciso lembrar de atualizar três arquivos em duas linguagens; esquecer um deles quebra silenciosamente a limpeza de bundles antigos no update de clientes self-hosted (PHP) ou na sincronização de template da plataforma (JS).
- **Evidência:** ver blocos de código acima — regex idêntica caractere a caractere nas três fontes.
- **Refatoração sugerida:**
  1. Unificar as duas cópias PHP primeiro (mesmo runtime): mover `is_build_bundle_filename()` e `is_editor_asset_bundle_filename()` de `panel/php/lib/platform.php` para um novo arquivo `editor/php/bio-storage.php`-like, por exemplo `editor/php/vite-bundles.php`, e fazer `panel/php/lib/platform.php` incluir esse arquivo (ele já é copiado para dentro de cada cliente, então o panel pode `require` a mesma cópia usada pelo editor). Isso já elimina uma das três fontes sem tocar em `update-apply.php`.
  2. Para a cópia JS, não é possível compartilhar arquivo diretamente com o PHP; documentar explicitamente no topo de `scripts/lib/vite-bundles.mjs` e do novo arquivo PHP unificado que a regex é espelhada manualmente e apontar um para o outro em comentário, para que uma mudança futura seja buscada nos dois lugares (`grep -rn "A-Za-z0-9_-]{6,}"` já localiza as duas ocorrências rapidamente).
  3. Adicionar um teste/verificação simples (pode ser um script de CI ou apenas um checklist no `docs/ATUALIZACOES-REMOTAS.md`) que compare as duas regex extraídas dos dois arquivos-fonte e falhe se divergirem.

## Achado #2 — `bio-path.php` duplicado byte-a-byte entre `editor/` e `panel/`

- **Severidade:** Médio
- **Categoria:** Duplicação
- **Local:** `editor/php/bio-path.php:1-91` e `panel/php/lib/bio-path.php:1-83`
- **Problema encontrado:** as funções `bio_path_client_root_from_editor()`, `bio_path_json_file()`, `bio_path_to_relative()`, `write_bio_path_json()`, `read_bio_path_json_relative()` e `bio_path_to_web_url()` existem palavra por palavra nos dois arquivos. A única diferença é que a versão em `editor/php` envolve cada função em `if (!function_exists(...))`, e a versão em `panel/php/lib` não tem essa proteção.
- **Por que isso é um problema:** é lógica de resolução de caminho (usada para descobrir onde fica o `bio.json` de cada cliente e gravar `bio-path.json`) mantida em dois lugares por cópia manual — qualquer correção de bug (ex.: em `bio_path_to_relative`, que já tem lógica não trivial de `realpath`/normalização de separador) precisa ser replicada nos dois arquivos manualmente, sem qualquer aviso se uma cópia for esquecida. Além disso, a ausência dos guards `function_exists` na cópia do `panel/php/lib` é uma inconsistência já observável: se esse arquivo algum dia for incluído duas vezes no mesmo request (padrão que a própria cópia do editor foi escrita para tolerar), o painel quebra com "Cannot redeclare function" enquanto o editor não quebraria.
- **Evidência:**
  ```php
  // editor/php/bio-path.php:17
  if (!function_exists('bio_path_to_relative')) {
    function bio_path_to_relative(string $absoluteBioPath, string $clientRoot): string
    { ... }
  }
  ```
  ```php
  // panel/php/lib/bio-path.php:16
  function bio_path_to_relative(string $absoluteBioPath, string $clientRoot): string
  { ... }
  ```
- **Refatoração sugerida:**
  1. Escolher `editor/php/bio-path.php` como fonte única (já tem os guards, mais defensivo) e fazer `panel/php/lib/bio-path.php` apenas `require_once` esse arquivo por caminho relativo, ou copiá-lo via script de build/empacotamento em vez de manter uma segunda cópia versionada manualmente no repositório.
  2. Se motivos de deploy (o panel não pode depender de arquivos dentro de `editor/`) impedirem o `require_once` direto, ao menos adicionar os mesmos guards `function_exists` na cópia do panel, para eliminar a única divergência de comportamento hoje existente entre as duas cópias.

## Achado #3 — `client-guard.php` com duas fontes-mestras mantidas manualmente em sincronia

- **Severidade:** Alto
- **Categoria:** Duplicação
- **Local:** `editor/php/client-guard.php:1-47` e `panel/php/client-gate/client-guard.php:1-47`; ponto de uso do provisionamento em `panel/php/lib/license.php:367-371`
- **Problema encontrado:** os dois arquivos são idênticos byte a byte hoje, mas **não existe nenhum vínculo em build/versionamento entre eles** — são dois arquivos-fonte distintos no repositório. `editor/php/client-guard.php` é o arquivo usado no dev local do editor e empacotado pelo fluxo single-tenant (`make package` / `npm run editor:hostgator`). Já `panel/php/client-gate/client-guard.php` é a cópia que `install_client_license_gate_files()` usa para *gravar* o `client-guard.php` dentro do `editor/` de cada cliente novo provisionado pela plataforma:
  ```php
  // panel/php/lib/license.php:367-371
  $guardPhp = $gateDir . '/client-guard.php';
  $editorDir = $clientDir . DIRECTORY_SEPARATOR . 'editor';
  if (file_exists($guardPhp) && is_dir($editorDir)) {
    copy($guardPhp, $editorDir . DIRECTORY_SEPARATOR . 'client-guard.php');
  }
  ```
- **Por que isso é um problema:** esse arquivo decide se a conta do cliente está suspensa ou com licença inválida (`require_client_active()`), ou seja, é lógica de controle de acesso/segurança. Se alguém corrigir um bug ou reforçar uma verificação em `editor/php/client-guard.php` (o local "óbvio" para um dev mexer, já que é o arquivo do dev local do editor) e esquecer de replicar em `panel/php/client-gate/client-guard.php`, **todo cliente novo provisionado pela plataforma a partir daí recebe a versão desatualizada** — um bug de guard de licença pode ficar sem o fix em produção sem que ninguém perceba, porque os testes locais do editor usam a outra cópia.
- **Evidência:** ver bloco acima; os dois arquivos foram comparados por `diff` e são idênticos no estado atual do repositório.
- **Refatoração sugerida:**
  1. Definir `panel/php/client-gate/client-guard.php` como fonte única (é a que efetivamente chega em clientes da plataforma) e fazer `editor/php/client-guard.php` deixar de existir como arquivo versionado — em vez disso, os scripts de empacotamento single-tenant (`scripts/package-core.mjs` / `scripts/package-deploy.mjs`, a checar) devem copiar de `panel/php/client-gate/client-guard.php` para dentro do pacote `editor/php/` gerado, do mesmo jeito que `license.php` já faz para clientes da plataforma.
  2. Enquanto isso não é feito, adicionar um comentário no topo de ambos os arquivos apontando um para o outro ("cópia idêntica de X — mudanças aqui precisam ser replicadas manualmente lá") para reduzir o risco de esquecimento até a unificação.

## Achado #4 — `ThemeToggle.tsx` e `theme.ts` duplicados entre `editor/` e `panel/`, já com divergência de comportamento

- **Severidade:** Médio
- **Categoria:** Duplicação
- **Local:** `editor/src/components/ThemeToggle.tsx:1-32` vs `panel/src/components/ThemeToggle.tsx:1-28`; `editor/src/lib/theme.ts:1-18` vs `panel/src/lib/theme.ts:1-14`
- **Problema encontrado:** os dois componentes e os dois módulos de tema têm exatamente a mesma estrutura (mesmo JSX, mesmas classes, mesmas funções `getStoredTheme`/`applyTheme`), mudando apenas a `STORAGE_KEY` do `localStorage` (`insta-bio-admin-theme` vs `linksnabio-panel-theme`) — o que é esperado, já que são apps servidos em origens diferentes. O problema é que a versão do editor já recebeu uma correção que a do painel não tem: `editor/src/components/ThemeToggle.tsx:8-10` adiciona um `useEffect` que rechama `getStoredTheme()` no mount, e `editor/src/lib/theme.ts:16-18` adiciona `initTheme()`; nenhum dos dois existe na versão do painel.
- **Por que isso é um problema:** é a prova concreta de que a duplicação já causou dessincronia — se o `useEffect` em `editor/src/components/ThemeToggle.tsx:8-10` existe para corrigir um caso real (ex.: tema aplicado por script inline no `<head>` antes do React montar, e o estado do componente precisa re-ler o `localStorage` para não mostrar o ícone errado), o painel tem exatamente o mesmo tipo de bug potencial e não recebeu o fix.
- **Evidência:**
  ```tsx
  // editor/src/components/ThemeToggle.tsx:6-10
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())
  useEffect(() => {
    setTheme(getStoredTheme())
  }, [])
  ```
  ```tsx
  // panel/src/components/ThemeToggle.tsx:6
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())
  // (sem useEffect equivalente)
  ```
- **Refatoração sugerida:**
  1. Curto prazo, isolado e seguro: replicar o `useEffect` de `editor/src/components/ThemeToggle.tsx:8-10` em `panel/src/components/ThemeToggle.tsx`, e adicionar `initTheme()` em `panel/src/lib/theme.ts` (idêntico ao do editor) — resolve a divergência sem exigir infraestrutura nova.
  2. Médio prazo: como `editor/`, `panel/` e `site/` já são builds Vite independentes sem pacote compartilhado, avaliar criar um pequeno pacote local (ex.: `packages/ui-shared` com `theme.ts` + `ThemeToggle.tsx`) referenciado via alias do Vite (o repo já usa alias tipo `@bio-types`/`@site` no editor, então o padrão de import via alias já existe e pode ser estendido).
