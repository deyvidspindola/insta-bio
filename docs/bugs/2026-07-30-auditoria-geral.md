# Relatório de Bugs — Auditoria geral (2026-07-30)

## Resumo
- Total de bugs encontrados: 5
- Críticos: 1 · Altos: 1 · Médios: 2 · Baixos: 1
- Áreas afetadas: editor (PHP + React), panel (PHP)

## Bug #1 — `paths.php` permite gravar o bio.json em qualquer caminho do servidor, inclusive na pasta de outro cliente
- **Severidade:** Crítico
- **Categoria:** Segurança (path traversal / escrita arbitrária, cross-tenant)
- **Local:** `editor/php/editor-paths.php:23-56` (`editor_normalize_bio_path_input`), consumido por `editor/php/paths.php:28-46`; a gravação efetiva ocorre em `editor/php/save.php:24`, `editor/php/publish.php:25-34` e `editor/php/bio-storage.php:8-19` (`bio_published_path`/`bio_draft_path`, que retornam literalmente `BIO_JSON_PATH`).
- **Descrição:** O endpoint autenticado `POST /api/bio/paths` aceita um `bioJsonPath` arbitrário vindo do body JSON e só valida que (a) não é vazio, (b) termina em `.json`, (c) não contém byte nulo. Para caminhos absolutos (`input[0] === '/'`) o valor é usado **verbatim**, sem `realpath()` nem verificação de que o resultado fica dentro da pasta do próprio cliente. Para caminhos relativos, a função faz `$editorDir . '/' . ltrim($input, '/')` — isso **não remove `..`**, então `"../../outro-slug/bio.json"` resolve para fora da árvore do cliente. O valor aceito é persistido em `auth.config.php` (via `editor_write_paths_config`) e passa a ser `BIO_JSON_PATH`, usado por `save.php`/`publish.php` para gravar o conteúdo enviado pelo próprio usuário do editor.
- **Impacto (o que afeta):** Na topologia descrita em `docs/PLATAFORMA.md` (todos os clientes provisionados como `public_html/{slug}/`, mesma conta de hospedagem, mesmo usuário de sistema para PHP), qualquer cliente autenticado no **seu próprio editor** pode, através deste endpoint, apontar `BIO_JSON_PATH` para `public_html/{outro-slug}/bio.json` (ou qualquer outro `.json` gravável pelo processo PHP) e em seguida usar `Salvar`/`Publicar` para sobrescrever o conteúdo de outro cliente ou de qualquer arquivo `.json` alcançável — sem precisar de credenciais desse outro cliente. É uma escalação de "editor do próprio site" para "escrita arbitrária cross-tenant".
- **Evidência:**
  ```php
  // editor/php/editor-paths.php
  if ($input[0] === '/' || preg_match('#^[A-Za-z]:[/\\\\]#', $input)) {
    $resolved = str_replace('\\', '/', $input);           // aceito sem checagem de raiz
  } else {
    $resolved = str_replace('\\', '/', $editorDir . '/' . ltrim($input, '/'));  // não remove ".."
  }
  ```
- **Solução proposta:** Depois de montar `$resolved`, resolver com `realpath()` (ou `realpath(dirname($resolved)) . '/' . basename($resolved)` quando o arquivo ainda não existe) e validar com `str_starts_with($resolvedReal, $allowedRoot . '/')`, onde `$allowedRoot` é a pasta do cliente (`dirname(__DIR__)`, ou `PLATFORM_ROOT` apenas se explicitamente permitido para instalações self-hosted fora do padrão). Rejeitar com erro 400 qualquer caminho cujo real path fique fora dessa raiz, antes de aceitar em `editor_normalize_bio_path_input`.

## Bug #2 — Upload de imagens aceita SVG sem sanitização, permitindo XSS armazenado
- **Severidade:** Alto
- **Categoria:** Segurança (stored XSS)
- **Local:** `editor/php/upload.php:39` (whitelist de extensões inclui `svg`) e `editor/php/upload.php:64` (`file_put_contents` grava o conteúdo enviado sem inspecionar/filtrar o SVG).
- **Descrição:** `upload.php` valida apenas a extensão do arquivo (`png|jpg|jpeg|gif|webp|svg|mp4|webm|mov`) e o tamanho, mas nunca inspeciona o conteúdo. Um arquivo `.svg` pode conter `<script>` ou atributos `on*` executáveis. O arquivo é salvo em `ASSETS_DIR` e servido estaticamente pelo Apache com `Content-Type: image/svg+xml` (nenhum `.htaccess` do projeto define `X-Content-Type-Options` ou `Content-Security-Policy` — confirmado em `deploy/apache/*` e nos `.htaccess` gerados por `write_client_htaccess()`), fazendo o navegador executar o script quando a URL do asset é aberta diretamente (nova aba, link direto, compartilhamento).
- **Impacto (o que afeta):** Qualquer usuário com sessão no editor (ou vítima de CSRF/sessão comprometida) pode enviar um SVG malicioso para `assets/` do próprio cliente. Quem abrir a URL do asset diretamente (o próprio administrador, um visitante que clique num link de "documento"/"imagem" da bio, ou alguém que receba a URL) executa JavaScript no contexto de origem do domínio do cliente — podendo ler/roubar o que estiver acessível via JS naquele domínio (ver Bug #3 sobre o cookie de sessão do editor).
- **Evidência:**
  ```php
  $allowed = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov'];
  if ($ext === '' || !in_array($ext, $allowed, true)) { $ext = 'png'; }
  ...
  if (file_put_contents(ASSETS_DIR . '/' . $filename, $bytes) === false) { ... }
  ```
- **Solução proposta:** Ou (a) remover `svg` da whitelist de upload de imagens de conteúdo (manter apenas raster/vídeo), ou (b) sanitizar o SVG antes de gravar — parsear com `DOMDocument`/`libxml`, remover `<script>`, atributos `on*`, `xlink:href`/`href` com `javascript:`, e `<foreignObject>` — e adicionalmente servir `assets/` com header `Content-Disposition: attachment` para tipos não confiáveis ou `Content-Security-Policy: script-src 'none'` no `.htaccess` da pasta `assets/`.

## Bug #3 — Sessão do editor sem `HttpOnly`/`SameSite`/`Secure` explícitos
- **Severidade:** Médio
- **Categoria:** Segurança (configuração de sessão)
- **Local:** `editor/php/login.php`, `editor/php/session.php`, `editor/php/establish-session.php`, `editor/php/save.php`, `editor/php/publish.php`, `editor/php/upload.php` — todos chamam `session_start()` diretamente, sem qualquer `session_set_cookie_params()`. Contraste com `panel/php/bootstrap.php:139-154` (`platform_session_start()`), que define explicitamente `httponly`, `samesite => 'Strict'` e `secure` condicional.
- **Descrição:** O painel (`panel/php`) endurece o cookie de sessão explicitamente; o editor (`editor/php`) não define nada e depende inteiramente dos defaults do `php.ini` do host (não há `.user.ini` nem diretivas `php_value session.cookie_*` em nenhum `.htaccess` do projeto). Em muitas instalações padrão de hospedagem compartilhada esses defaults não incluem `SameSite=Strict/Lax` nem garantem `HttpOnly` explicitamente configurado pela aplicação — a aplicação não pode assumir que o host está configurado de forma seletiva.
- **Impacto (o que afeta):** Combinado com o Bug #2 (XSS armazenado via SVG) ou qualquer XSS futuro no domínio do editor, a ausência de `HttpOnly` explícito aumenta o risco de furto do cookie de sessão do editor via JavaScript. A ausência de `SameSite` explícito também enfraquece a proteção contra CSRF nos endpoints mutantes do editor (`save.php`, `publish.php`, `upload.php`, `delete-image.php`, `paths.php`), nenhum dos quais usa token CSRF — a única defesa hoje é o comportamento padrão do navegador para cookies sem atributo `SameSite`.
- **Evidência:**
  ```php
  // editor/php/save.php (idêntico em publish.php, upload.php, paths.php, etc.)
  require __DIR__ . '/client-guard.php';
  require_client_active();
  session_start();   // <- nenhum session_set_cookie_params() antes
  ```
- **Solução proposta:** Criar uma função `editor_session_start()` em `editor/php` (equivalente a `platform_session_start()`) que chame `session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])])` antes de `session_start()`, e substituir todas as chamadas diretas a `session_start()` nos arquivos do editor por essa função.

## Bug #4 — `bio-json.php` do gate público ignora a checagem de licença/host/suspensão aplicada ao `index.php`
- **Severidade:** Médio
- **Categoria:** Confiabilidade / Segurança (inconsistência de gate de licença)
- **Local:** `panel/php/client-gate/bio-json.php:1-24` (nenhuma chamada a `require_client_license_active()` ou `require_client_active()`) vs. `panel/php/client-gate/index-gate.php:13` (`require_client_license_active();` antes de servir o HTML).
- **Descrição:** `index-gate.php` (o `index.php` de cada cliente) só serve o site depois de validar host autorizado, `deploy_path`, e status ativo da licença via `require_client_license_active()`. `bio-json.php` — usado pelo front-end React como fallback para buscar o `bio.json` (`bio/src/lib/loadBioConfig.ts:46-69`) — só verifica se `editor/auth.config.php` e o arquivo `BIO_JSON_PATH` existem no disco; não chama nenhuma função de `client-license.php`. O único mecanismo que indiretamente bloquearia esse arquivo é a regra de `.htaccess` que redireciona tudo para `suspended.html` quando existe `.suspended` — mas isso cobre apenas o caso "suspenso", não os casos de host/deploy_path incorretos (ex.: cópia não autorizada do pacote self-hosted para um domínio diferente do licenciado).
- **Impacto (o que afeta):** Um pacote self-hosted (ZIP gerado por `clients-export.php`) copiado para um host não autorizado teria `index.php` bloqueando a renderização (deny page), mas uma requisição direta a `bio-json.php` (por exemplo, via `curl`) ainda devolveria o conteúdo completo do `bio.json` do cliente — dado de negócio que o modelo de licenciamento self-hosted pretende proteger. Não expõe segredos, mas quebra a garantia de "licença inválida = site indisponível" que o restante do sistema implementa.
- **Evidência:**
  ```php
  // panel/php/client-gate/bio-json.php — sem checagem de licença
  $authConfig = __DIR__ . '/editor/auth.config.php';
  if (!is_file($authConfig)) { ... }
  require $authConfig;
  if (!defined('BIO_JSON_PATH') || !is_file(BIO_JSON_PATH)) { ... }
  header('Content-Type: application/json; charset=utf-8');
  readfile(BIO_JSON_PATH);
  ```
- **Solução proposta:** No início de `bio-json.php`, incluir `client-license.php` e chamar `require_client_license_active()` (a mesma função usada por `index-gate.php`) antes de `readfile(BIO_JSON_PATH)`, retornando 503 com o mesmo corpo de erro usado no restante do gate quando a licença/host não confere.

## Bug #5 — `commit()` do editor atualiza o histórico de undo/redo como efeito colateral dentro do updater de `setConfig`
- **Severidade:** Baixo
- **Categoria:** Correção (efeito colateral em função "pura" de estado)
- **Local:** `editor/src/EditorApp.tsx:143-152` (`commit`), habilitado por `editor/src/main.tsx:12` (`<StrictMode>`).
- **Descrição:** `commit()` passa uma função updater para `setConfig`, e **dentro** dessa função chama `setPast(...)` e `setFuture([])` como efeitos colaterais:
  ```tsx
  function commit(updater) {
    setConfig((prev) => {
      if (!prev) return prev
      const next = ...
      const synced = { ...next, brand: syncBrandSeo(next.brand) }
      setPast((p) => [...p.slice(-(HISTORY_LIMIT - 1)), prev])  // efeito colateral
      setFuture([])                                              // efeito colateral
      return synced
    })
  }
  ```
  Funções passadas a `setState` devem ser puras — o React 18 em `StrictMode` (ativo em `main.tsx`) invoca essas funções **duas vezes** em desenvolvimento justamente para detectar esse tipo de impureza. Como resultado, em modo de desenvolvimento cada `commit()` empilha a mesma entrada de `prev` duas vezes em `past`, e `setFuture([])` é chamado duas vezes (inofensivo, mas sintoma do mesmo problema).
- **Impacto (o que afeta):** Em desenvolvimento (`npm run dev` com StrictMode), o histórico de undo (`past`) acumula entradas duplicadas a cada edição — o botão "Desfazer" pode precisar de dois cliques para reverter uma única alteração visível, e o limite `HISTORY_LIMIT` (50) é consumido em metade do número real de edições. Em build de produção o React não faz a dupla invocação, então o usuário final não é afetado — mas o bug compromete testes manuais de undo/redo durante o desenvolvimento e é uma violação de regra do React que pode gerar comportamento imprevisível em versões futuras do React que dependam dessa pureza.
- **Evidência:** ver trecho acima.
- **Solução proposta:** Calcular `synced` fora do updater (usando o valor de `config` do estado do componente ou lendo `prev` só para computar, sem side-effects) e mover `setPast`/`setFuture` para depois de `setConfig`, no corpo de `commit()`, por exemplo:
  ```tsx
  function commit(updater) {
    setConfig((prev) => {
      if (!prev) return prev
      const next = typeof updater === 'function' ? updater(prev) : updater
      return { ...next, brand: syncBrandSeo(next.brand) }
    })
    setPast((p) => (config ? [...p.slice(-(HISTORY_LIMIT - 1)), config] : p))
    setFuture([])
  }
  ```
  (usando o `config` já disponível no closure do componente para empilhar o estado anterior, já que `commit` é sempre chamado a partir de um render com `config` atualizado).

## Notas / Falsos positivos descartados
- **SQL injection em `panel/php`:** todas as queries passam por `platform_db_execute()`, que usa `PDO::prepare`/`execute` e ainda lança exceção se detectar interpolação de variável na string SQL (`bootstrap.php:190-198`). Nenhum endpoint auditado (`clients-*.php`, `analytics-*.php`, `instagram-lookup.php`, `login.php`, `editor-login.php`, `editor-session.php`) concatena entrada do usuário em SQL — descartado.
- **Path traversal em `delete-image.php`/`list-images.php`:** `delete-image.php` usa `basename()` + regex de whitelist (`^[a-z0-9][a-z0-9._-]*\.(ext)$`) antes de tocar o filesystem — não há `..` possível. Descartado.
- **Zip-slip na extração de pacotes de update (`panel/php/lib/updates.php`):** o ZIP extraído vem de `panel/data/updates/`, controlado apenas pelo operador da plataforma (não é input de cliente/usuário final) — sem vetor de exploração externo identificado. Descartado como bug de segurança externo, embora seja uma prática frágil internamente.
- **CORS `Access-Control-Allow-Origin: *` em `editor-login.php`/`editor-session.php`/`analytics-track.php`:** essas rotas não usam cookies (autenticação via `slug`+`token`+`email`/`senha` no corpo, sem `Access-Control-Allow-Credentials`), então o `*` não expõe sessão de terceiros. Descartado.
