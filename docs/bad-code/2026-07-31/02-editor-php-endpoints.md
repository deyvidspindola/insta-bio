# Qualidade de Código — Editor PHP (endpoints) (2026-07-31)

Parte 2 de 5 · [Voltar ao resumo](00-resumo.md)

## Achado #1 — Boilerplate de sessão/autenticação repetido em 8 endpoints

- **Severidade:** Médio
- **Categoria:** Duplicação
- **Local:** o mesmo bloco de 6 a 8 linhas aparece, idêntico, em:
  - `editor/php/save.php:2-13`
  - `editor/php/publish.php:2-13`
  - `editor/php/load.php:2-13`
  - `editor/php/revert.php:2-13`
  - `editor/php/delete-image.php:2-13`
  - `editor/php/upload.php:2-12`
  - `editor/php/list-images.php:2-12`
  - `editor/php/update-status.php:12-30` (variação com método HTTP)
- **Problema encontrado:** o padrão dominante do próprio pacote é claríssimo — todo endpoint autenticado começa com:
  ```php
  require __DIR__ . '/auth.config.php';
  require __DIR__ . '/client-guard.php';
  [require __DIR__ . '/bio-storage.php';]   // quando o endpoint mexe no bio.json
  require_client_active();
  session_start();
  header('Content-Type: application/json');

  if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado']);
    exit;
  }
  ```
  Esse bloco está copiado e colado em 8 arquivos diferentes, sem nenhuma função que o encapsule — diferente de outras partes do mesmo pacote, que já extraem lógica repetida para arquivos dedicados (`bio-storage.php`, `client-guard.php`, `update-log.php`, `editor-paths.php`).
- **Por que isso é um problema:** é exatamente o tipo de duplicação que o próprio `client-guard.php` já resolveu para a checagem de licença/suspensão (`require_client_active()`) — mas a checagem de sessão autenticada (`$_SESSION['user']`) ficou de fora dessa extração e continua copiada. Qualquer mudança na forma de validar sessão (ex.: adicionar verificação de expiração, trocar a chave de sessão, adicionar log de acesso) exige editar 8 arquivos manualmente; esquecer um deles cria um endpoint com autenticação desatualizada — um risco real de segurança, não só de manutenção.
- **Evidência:** ver bloco acima; comparação byte a byte confirma que `save.php`, `publish.php`, `load.php` e `revert.php` têm as primeiras 13 linhas idênticas.
- **Refatoração sugerida:**
  1. Criar `editor/php/require-session.php` com uma função `require_editor_session(): void` que executa exatamente esse bloco (auth.config + client-guard + require_client_active + session_start + header + checagem de `$_SESSION['user']`) e retorna/`exit` como hoje.
  2. Trocar, um endpoint por vez (é seguro fazer isolado, sem tocar nos demais no mesmo commit), as primeiras linhas de `save.php`, `publish.php`, `load.php`, `revert.php`, `delete-image.php`, `upload.php`, `list-images.php` e `update-status.php` para `require __DIR__ . '/require-session.php'; require_editor_session();` seguido do `require` específico de cada endpoint (ex.: `bio-storage.php`).
  3. Não mexer em `update-check.php` e `analytics-report.php` nessa refatoração — eles já têm tratamento de erro próprio via `editor_update_fail()`/logging e checagem de sessão inline com propósito ligeiramente diferente (log estruturado); merecem avaliação separada, não uma extração forçada só para "bater" com os demais.

## Achado #2 — `update-apply.php` quebra o padrão de extrair helpers para arquivos dedicados

- **Severidade:** Alto
- **Categoria:** Organização/Coesão · Desvio de arquitetura
- **Local:** `editor/php/update-apply.php:1-603`, funções auxiliares definidas inline em `update-apply.php:61-283` (`isBundleFile`, `isEditorAssetBundle`, `removeBundleFiles`, `copyDirExcept`, `copyFile`, `siteStaticRootFiles`, `sitePackageRootFilesToApply`, `copySitePackageRoot`, `verifySitePackageRoot`, `siteBundlesReferencedInHtml`, `ensureDirectory`, `removeTempDir`)
- **Problema encontrado:** o padrão dominante em `editor/php/` é: endpoint fino (`save.php`, `publish.php`, `load.php`, `upload.php`, `list-images.php`, todos com 30-70 linhas) chamando funções definidas em arquivos de biblioteca próprios (`bio-storage.php`, `client-guard.php`, `editor-paths.php`, `bio-path.php`, `update-log.php`, `platform-auth.php`). `update-apply.php` é o único endpoint do pacote (603 linhas — mais que o dobro do segundo maior, `platform-auth.php` com 319) que define suas próprias 11 funções auxiliares de manipulação de arquivos diretamente no escopo global do script, misturando nesse mesmo arquivo: download HTTP, validação de checksum, extração de ZIP, backup, cópia de diretórios, remoção de arquivos temporários e atualização de estado — sete responsabilidades diferentes num único arquivo, sem separação em módulo.
- **Por que isso é um problema:** torna o arquivo mais crítico do fluxo de auto-atualização remota (aplica update em produção, com backup e rollback implícito) o mais difícil de revisar e testar isoladamente do pacote — não há como testar `copyDirExcept()` ou `sitePackageRootFilesToApply()` sem carregar o script inteiro (que já teria disparado `session_start()` e checagens de ambiente no topo do arquivo antes de chegar nas definições de função). Isso também é a raiz do Achado #1 da Parte 1 (regra de bundle Vite triplicada): como as funções vivem soltas dentro do endpoint, não há um lugar natural para reutilizá-las a partir de `panel/php/lib/platform.php`.
- **Evidência:**
  ```php
  // editor/php/update-apply.php:56-70
  // 6. Funções auxiliares (espelham sync-clients-template.mjs)
  function isBundleFile($name) { ... }
  function isEditorAssetBundle($name) { ... }
  function removeBundleFiles($dir, $editorMode = false) { ... }
  ```
  Compare com o início de `editor/php/save.php:1-4`, que não define nenhuma função — só orquestra chamadas a `bio-storage.php`.
- **Refatoração sugerida (em passos incrementais, sem reescrever o fluxo de update):**
  1. Criar `editor/php/update-file-ops.php` e mover para lá, sem alterar o corpo, as 11 funções auxiliares hoje definidas em `update-apply.php:61-283` (isso por si só já reduz o endpoint de 603 para ~380 linhas sem tocar na lógica de negócio).
  2. `update-apply.php` passa a `require_once __DIR__ . '/update-file-ops.php';` no topo, junto dos demais `require`.
  3. Só depois disso (passo separado, não neste commit) avaliar se `is_build_bundle_filename`/`is_editor_asset_bundle_filename` desse novo arquivo podem ser reaproveitadas por `panel/php/lib/platform.php` (Achado #1 da Parte 1), evitando a terceira cópia da mesma regex.
