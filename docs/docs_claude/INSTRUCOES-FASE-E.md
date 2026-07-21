# Fase E — instruções de operação e release

## O que esta fase cobre

- **Documentação** final para equipe (dev/operação) sobre como publicar novas versões com suporte a atualizações remotas.
- **Checklist manual** para cada release em produção.
- **Configuração do ambiente da plataforma** para servir os pacotes via API autenticada.
- **Atualização dos docs** do projeto (HOSTGATOR.md, COMERCIALIZACAO.md, EDITOR.md) com orientações para clientes e para você.
- **Teste end‑to‑end** com um cliente single‑tenant real.

**A Fase E não implementa novos endpoints PHP ou componentes React – ela organiza e documenta o que já foi feito nas fases A–D.**

---

## 1. Pré‑requisitos (já concluídos)

- [x] Fase A: geração do ZIP e `updates.json` via `npm run build:update-package`.
- [x] Fase B: card de versão no editor (`update-status.php`, `UpdatesCard.tsx`).
- [x] Fase C: botão “Buscar atualizações” (`update-check.php`, chamada à API da plataforma).
- [x] Fase D: aplicação de atualizações (`update-apply.php`, backup, SHA, limpeza de bundles).
- [x] O fluxo foi testado localmente com mocks.

---

## 2. Checklist para o primeiro release com suporte a updates

### 2.1. Preparar o servidor da plataforma

A plataforma (`linksnabio.app.br`) precisa servir os pacotes ZIP e o manifesto via **API autenticada** (não como arquivos públicos).  

#### Criar os endpoints no painel

No diretório `panel/php/`, crie os arquivos:

- `updates/check.php` – recebe `slug` + `token` + `installed`, retorna metadados da última versão.
- `updates/package.php` – valida licença e retorna uma **URL assinada** (ex.: com expiração de 5 minutos) para o ZIP, ou faz o stream do arquivo.

**Modelo rápido para `updates/check.php`** (adapte ao seu `bootstrap.php` e `lib/license.php`):

```php
<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$input = json_decode(file_get_contents('php://input'), true);
$slug = $input['slug'] ?? '';
$token = $input['token'] ?? '';
$installed = $input['installed'] ?? '0.0.0';

if (empty($slug) || empty($token)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Dados de licença incompletos.']);
    exit;
}

// Validar licença (reutilize a função existente que consulta a tabela de clientes)
$client = lookup_client_by_slug_and_token($slug, $token);
if (!$client || $client['status'] !== 'active') {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Licença inválida ou inativa.']);
    exit;
}

// Ler o manifesto de updates (gerado pela Fase A)
$updatesJsonPath = '/caminho/para/updates.json'; // fora do docroot, se possível
if (!file_exists($updatesJsonPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Manifesto de versões não encontrado.']);
    exit;
}
$updates = json_decode(file_get_contents($updatesJsonPath), true);
$latest = $updates['latest'] ?? '0.0.0';
$package = $updates['packages'][$latest] ?? null;

if (!$package) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Pacote da última versão não disponível.']);
    exit;
}

$updateAvailable = version_compare($latest, $installed, '>');

echo json_encode([
    'ok' => true,
    'updateAvailable' => $updateAvailable,
    'latest' => $latest,
    'releasedAt' => $package['releasedAt'] ?? null,
    'changelog' => $package['changelog'] ?? '',
]);
```
Modelo para updates/package.php (gera URL assinada):

```php
<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$input = json_decode(file_get_contents('php://input'), true);
$slug = $input['slug'] ?? '';
$token = $input['token'] ?? '';

// Validar licença (mesmo código de check)
$client = lookup_client_by_slug_and_token($slug, $token);
if (!$client || $client['status'] !== 'active') {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Licença inválida ou inativa.']);
    exit;
}

// Ler manifesto e obter URL do ZIP
$updatesJsonPath = '/caminho/para/updates.json';
$updates = json_decode(file_get_contents($updatesJsonPath), true);
$latest = $updates['latest'] ?? null;
$package = $updates['packages'][$latest] ?? null;
if (!$latest || !$package) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Pacote não encontrado.']);
    exit;
}

// Gerar URL assinada (ex.: com hash de tempo + token secreto)
$basePath = '/caminho/para/updates'; // onde os ZIPs estão armazenados
$zipFile = $basePath . '/' . $package['url']; // url é só o nome do arquivo
if (!file_exists($zipFile)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Arquivo ZIP não encontrado.']);
    exit;
}

// Assinatura simples (você pode usar JWT ou um hash)
$expires = time() + 300; // 5 minutos
$secret = 'SEU_SECRETO_AQUI';
$signature = hash_hmac('sha256', $zipFile . $expires, $secret);
$signedUrl = "https://linksnabio.app.br/updates/{$package['url']}?expires={$expires}&signature={$signature}";

echo json_encode([
    'ok' => true,
    'url' => $signedUrl,
    'sha256' => $package['sha256'],
    'version' => $latest,
    'size' => $package['size'],
]);
```
Proteção do download (.htaccess ou script de stream):
Crie um script download.php que valida a assinatura antes de servir o arquivo, ou configure o .htaccess para negar acesso direto a *.zip e só permitir via parâmetros. Recomenda-se usar um script PHP para fazer o stream com verificação.

### 2.2. Configurar diretório de updates/ na plataforma
Crie uma pasta fora do docroot (ex.: /home/linksnabio/data/updates/) para armazenar:

updates.json (manifesto histórico)

insta-bio-X.Y.Z.zip (todos os ZIPs)

Ou mantenha dentro de uma subpasta com .htaccess negando acesso direto. O importante é que nenhum ZIP seja acessível publicamente sem assinatura.

### 2.3. Integrar geração do ZIP ao fluxo de release
Atualize seu script de release (ex.: make package ou scripts/package-deploy.mjs) para que, sempre que uma nova versão for publicada, o comando npm run build:update-package seja executado e os artefatos copiados para o servidor da plataforma.

Adicione um passo final no seu deploy:

```bash
npm run build:update-package
scp dist/updates/* user@plataforma:/caminho/para/updates/
```
### 2.4. Atualizar documentação do projeto
docs/HOSTGATOR.md
Adicione uma seção sobre atualizações remotas explicando que, após a Fase D, clientes em domínio próprio podem atualizar pelo próprio editor, sem necessidade de FTP manual.

```md
## Atualizações automáticas (a partir da versão X.X.X)

Clientes em domínio próprio (single‑tenant) podem atualizar o template diretamente do editor, na aba **Configurações → Buscar atualizações**.

O fluxo é semelhante ao WordPress: o sistema verifica se há uma versão nova, baixa o pacote assinado, faz backup e substitui os arquivos preservando dados do cliente (`bio.json`, `assets/`, `auth.config.php`).

Caso ocorra algum erro, o backup é mantido em `editor/.update-backup/` para recuperação manual.
```
`docs/COMERCIALIZACAO.md`
Atualize a parte de manutenção: agora você pode oferecer planos que incluem atualizações automáticas, reduzindo suporte.

`docs/EDITOR.md`
Inclua a seção Configurações → Atualizações com a explicação do que o cliente vê.

### 2.5. Gravar update-state.json no sync do painel (opcional, mas recomendado)
Para que clientes da plataforma também tenham a versão e data corretas no editor, modifique o script de sync do painel (panel/php/sync-client.php ou scripts/sync-clients-template.mjs) para, ao final da cópia, escrever editor/update-state.json com a versão atual do template e a data do sync.

Isso garante que o card de versão funcione também para clientes da plataforma.

## 3. Checklist de release (manual, para cada nova versão)
1. Atualize o arquivo VERSION na raiz do monorepo com o novo número SemVer.
2. Rode os builds:
```bash
npm run build
npm run editor:hostgator
```
3. Gere o pacote de atualização:
```bash
npm run build:update-package -- --changelog="Breve descrição das mudanças"
```
4. Valide o ZIP:
```bash
unzip -l dist/updates/insta-bio-$(cat VERSION).zip
```
Confirme a estrutura e a ausência de arquivos sensíveis.
5. Copie os artefatos para o servidor da plataforma:
```bash
scp dist/updates/insta-bio-*.zip user@plataforma:/caminho/para/updates/
scp dist/updates/updates.json user@plataforma:/caminho/para/updates/
```
6. Faça o deploy do restante do código (bio + editor) para a plataforma e para clientes via FTP (se ainda não estiver automatizado).
7. Teste em um cliente single‑tenant:
	- Faça login no editor.
	- Acesse Configurações.
	- Clique em Buscar atualizações – deve encontrar a nova versão.
	- Clique em Atualizar agora – deve concluir com sucesso, e a versão exibida deve ser a nova.
8. Atualize a documentação se houver mudanças significativas no fluxo.

## 4. Teste end‑to‑end (cenários obrigatórios)
- Cliente single‑tenant com bio.json na raiz → atualização preserva o conteúdo.
- Cliente single‑tenant com painel/bio.json e painel/assets/ → imagens e rascunho intactos.
auth.config.php permanece inalterado e login ainda funciona.
- Bundles antigos (index-OLDHASH.js, main-OLDHASH.css, preview-OLDHASH.js) são removidos.
- A pasta de backup (editor/.update-backup/) contém os arquivos anteriores.
- Em caso de falha (SHA inválido, ZIP corrompido), nenhum arquivo é alterado e o temp é limpo.
- Cliente plataforma (com platform-api.json) não exibe botão algum.
- Licença suspensa → API retorna 403 e o update não prossegue.

## 5. Riscos e armadilhas em produção
|Risco|	Mitigação
| ------------ | ------------ 
|ZIP muito grande (>50 MB) – pode estourar tempo de execução PHP	|Mantenha o build otimizado; avise se ultrapassar 50 MB; use `set_time_limit(0)` no PHP.
|Permissões de escrita no servidor do cliente	|O script `update-apply.php` precisa de permissão para escrever na raiz do site e em `editor/`. Verifique se o usuário PHP tem acesso.
|Memória insuficiente para extrair ZIP	|PHP `memory_limit` deve ser >= 256 MB. Ajuste no `php.ini` ou no script com `ini_set('memory_limit', '256M')`.
|Download via CURL falha (timeout, SSL)|	Use `curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false)` apenas em testes; em produção, mantenha true. Aumente timeout.
|URL assinada expira durante download|	Assinatura com expiração de 5 minutos geralmente é suficiente; se o download for grande, aumente para 10 minutos.
|Backup não restaura automaticamente	|Documente como restaurar manualmente (copiar` editor/.update-backup/` de volta).
|Clientes com PHP 7.4	|`ZipArchive` está disponível; teste em ambiente HostGator com PHP 7.4.
## 6. O que NÃO fazer nesta fase
-  Não desenvolver novas funcionalidades (rollback, canal beta, manutenção, UI elaborada).
-  Não alterar o código das fases anteriores, a menos que seja para ajustar a integração com a API real.
-  Não automatizar o deploy dos ZIPs para produção sem antes validar manualmente.

## 7. Documentos finais que devem ser atualizados
| Arquivo  | Alteração
| ------------ | ------------ 
| `docs/HOSTGATOR.md`  |  Nova seção sobre atualizações automáticas (ver 2.4) 
|`docs/COMERCIALIZACAO.md`| Menção ao recurso como diferencial
|`docs/EDITOR.md`|	Seção "Configurações → Atualizações"
|`README.md`| (opcional)	Link para a documentação do fluxo

## 8. Próximos passos (pós MVP)
- Implementar rollback (reverter para versão anterior via backup).
- Adicionar canal beta no manifesto (clientes opt‑in).
- Criar modo manutenção durante o apply para evitar inconsistências.
- Assinar os pacotes com GPG (além do SHA‑256).

A Fase E está concluída. Agora você tem todas as peças para colocar as atualizações remotas em produção. Após seguir este checklist e validar com um cliente real, o sistema estará pronto para uso.