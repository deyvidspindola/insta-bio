# Qualidade de Código — Panel PHP (2026-07-31)

Parte 3 de 5 · [Voltar ao resumo](00-resumo.md)

## Achado #1 — `platform.php` acumula 5 responsabilidades diferentes em 924 linhas / 32 funções

- **Severidade:** Médio
- **Categoria:** Organização/Coesão
- **Local:** `panel/php/lib/platform.php:1-924` (arquivo inteiro)
- **Problema encontrado:** o restante de `panel/php/lib/` segue um padrão de arquivo por responsabilidade — `analytics.php` (métricas/schema de analytics), `analytics-reports.php` (agregações para os endpoints de relatório), `license.php` (licenciamento/gate de cliente), `input.php` (sanitização de entrada), `editor-auth.php` (login do editor via API). `platform.php` quebra esse padrão reunindo, no mesmo arquivo, funções de pelo menos cinco domínios diferentes e sem relação direta entre si:
  - utilitários genéricos (`normalize_slug:5`, `validate_slug:14`, `generate_password:35`, `copy_directory:46`)
  - provisionamento de cliente novo (`platform_provision_check:89`, `write_editor_paths_config:165`, `write_client_auth_config:212`, `write_client_htaccess:227`)
  - leitura/customização do `bio.json` do cliente (`client_read_bio_file:306`, `client_bio_has_content:321`, `client_resolve_export_bio:348`, `customize_bio_json:388`)
  - motor de sincronização de template/bundle Vite (`count_build_bundles:432`, `is_build_bundle_filename:468`, `sync_client_bio_from_template:514`, `sync_client_from_template:617`, `sync_all_clients_from_template:658`)
  - ciclo de vida do registro do cliente (`remove_directory:719`, `provision_client:741`, `update_client:810`)
- **Por que isso é um problema:** um novo desenvolvedor que precisa entender "como funciona o provisionamento de cliente" precisa ler um arquivo de quase mil linhas que também contém, misturado, o motor de sincronização de bundle Vite (que é o mesmo assunto do Achado #1 da Parte 1) e utilitários genéricos de string. Isso aumenta o custo de qualquer mudança: um ajuste na regra de bundle (que já é frágil, por estar triplicada) obriga a mexer no mesmo arquivo que contém a lógica sensível de criação/atualização de cliente, aumentando a chance de um erro de edição afetar uma função não relacionada.
- **Evidência:** contagem de funções por trecho do arquivo (`grep -n "^function " panel/php/lib/platform.php`) confirma os 5 grupos acima distribuídos ao longo de todo o arquivo, sem nenhuma separação por seção ou arquivo.
- **Refatoração sugerida (dividir em passos independentes, cada um movendo só um grupo):**
  1. Mover o grupo de sincronização de template/bundle (`count_build_bundles`, `is_build_bundle_filename`, `is_editor_asset_bundle_filename`, `copy_file_if_exists`, `remove_build_bundle_files`, `sync_client_bio_from_template`, `copy_directory_except_basenames`, `sync_client_editor_from_template`, `sync_client_from_update_package`, `sync_client_from_template`, `sync_all_clients_from_template`, linhas 432-718) para um novo `panel/php/lib/template-sync.php`, com `require_once` em `platform.php`. Isso também é o lugar natural para depois aplicar o Achado #1 da Parte 1 (unificar a regra de bundle com `editor/php`).
  2. Em um segundo commit, mover o grupo de bio/export (`client_read_bio_file`, `client_bio_has_content`, `client_resolve_export_bio`, `customize_bio_json`, linhas 306-431) para `panel/php/lib/client-bio.php`.
  3. Manter `provision_client`/`update_client`/utilitários genéricos em `platform.php`, que passa a ser só sobre ciclo de vida de cliente — mais alinhado ao nome do arquivo.

## Achado #2 — Registro de exceção (`platform_capture_exception`) aplicado de forma inconsistente nos endpoints `clients-*.php`

- **Severidade:** Baixo
- **Categoria:** Boas práticas · Desvio de arquitetura
- **Local:**
  - Chamam `platform_capture_exception($e)` também no `catch (InvalidArgumentException $e)`: `panel/php/clients-create.php:128-129`, `panel/php/clients-update.php:40-41`
  - Não chamam no `catch (InvalidArgumentException $e)` (só no `catch (Throwable $e)` seguinte): `panel/php/clients-delete.php:35-39`, `panel/php/clients-status.php:42-46`, `panel/php/clients-password.php:44-48`, `panel/php/clients-reset-password.php:47-51`
- **Problema encontrado:** os seis endpoints têm a mesma estrutura de dois `catch` (um para erro de validação, outro genérico) chamando a mesma função `platform_capture_exception()` definida em `panel/php/bootstrap.php:82`, cujo próprio comentário diz que ela deve capturar erros para "rastro da causa real" no log/Sentry. O padrão dominante entre os 6 arquivos (4 de 6) é **não** chamar essa função para erros de validação (`InvalidArgumentException`, que geram HTTP 400 — entrada inválida do usuário, não falha do sistema); `clients-create.php` e `clients-update.php` divergem desse padrão e chamam a função também nesse caso.
- **Por que isso é um problema:** não é um bug de segurança, mas gera comportamento inconsistente e ruído: com Sentry configurado, criar ou atualizar um cliente com um campo inválido (ex.: e-mail duplicado, que lança `InvalidArgumentException` dentro de `provision_client`/`update_client`) polui o rastreamento de erros como se fosse uma falha real do sistema, enquanto o mesmo tipo de erro em `clients-delete.php`/`clients-status.php`/`clients-password.php`/`clients-reset-password.php` não gera esse ruído. Isso torna o Sentry/log menos confiável como sinal de "algo quebrou de verdade" especificamente para os dois endpoints mais usados (criar/editar cliente).
- **Evidência:**
  ```php
  // panel/php/clients-update.php:40-43 (chama a função também no 400)
  } catch (InvalidArgumentException $e) {
    platform_capture_exception($e);
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
  ```
  ```php
  // panel/php/clients-delete.php:35-37 (não chama)
  } catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
  ```
- **Refatoração sugerida:**
  1. Definir o padrão dominante (4 de 6 arquivos) como o correto — não capturar `InvalidArgumentException` como exceção de sistema — e remover as duas chamadas de `platform_capture_exception($e)` dos blocos `catch (InvalidArgumentException $e)` em `clients-create.php:129` e `clients-update.php:41`.
  2. Mudança isolada e de baixo risco: cada arquivo pode ser ajustado independentemente, sem tocar nos outros quatro que já seguem o padrão.
