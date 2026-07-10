<?php
/**
 * Diagnóstico do servidor antes de colocar a bio no ar.
 * Acesse: https://seudominio.com/verificar-ambiente.php
 * JSON:   https://seudominio.com/verificar-ambiente.php?json=1
 */
declare(strict_types=1);

const MIN_PHP_VERSION = '8.0.0';
const RECOMMENDED_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * @return list<array{id: string, ok: bool, label: string, detail: string, warning?: bool}>
 */
function client_environment_checks(string $root): array
{
  $checks = [];

  $add = static function (
    string $id,
    bool $ok,
    string $label,
    string $detail,
    bool $warning = false,
  ) use (&$checks): void {
    $checks[] = [
      'id' => $id,
      'ok' => $ok,
      'label' => $label,
      'detail' => $detail,
      'warning' => $warning,
    ];
  };

  $phpOk = version_compare(PHP_VERSION, MIN_PHP_VERSION, '>=');
  $add(
    'php_version',
    $phpOk,
    'Versão do PHP',
    $phpOk
      ? 'PHP ' . PHP_VERSION . ' (mínimo ' . MIN_PHP_VERSION . ')'
      : 'PHP ' . PHP_VERSION . ' — necessário PHP ' . MIN_PHP_VERSION . ' ou superior',
  );

  foreach (['json' => 'JSON', 'session' => 'Sessões', 'hash' => 'Hash (senhas bcrypt)'] as $ext => $label) {
    $ok = extension_loaded($ext);
    $add('ext_' . $ext, $ok, 'Extensão ' . $label, $ok ? 'Disponível' : 'Extensão PHP ausente: ' . $ext);
  }

  $mbstring = extension_loaded('mbstring');
  $add(
    'ext_mbstring',
    $mbstring,
    'Extensão mbstring',
    $mbstring ? 'Disponível' : 'Recomendado para nomes de arquivo com acentos',
    !$mbstring,
  );

  $curl = extension_loaded('curl');
  $fopen = (bool) ini_get('allow_url_fopen');
  $licenseOk = $curl || $fopen;
  $add(
    'license_http',
    $licenseOk,
    'Validação de licença (HTTP)',
    $licenseOk
      ? ($curl ? 'curl disponível' : 'allow_url_fopen ativo')
      : 'Ative curl ou allow_url_fopen para validar a licença online',
    !$licenseOk,
  );

  $uploadMax = ini_parse_size((string) ini_get('upload_max_filesize'));
  $postMax = ini_parse_size((string) ini_get('post_max_size'));
  $uploadOk = $uploadMax >= RECOMMENDED_UPLOAD_BYTES && $postMax >= RECOMMENDED_UPLOAD_BYTES;
  $add(
    'upload_limits',
    $uploadOk,
    'Limites de upload',
    'upload_max_filesize=' . ini_get('upload_max_filesize')
      . ', post_max_size=' . ini_get('post_max_size')
      . ($uploadOk ? '' : ' — recomendado pelo menos 5M para imagens/vídeos no editor'),
    !$uploadOk,
  );

  $probeDir = $root . DIRECTORY_SEPARATOR . '.probe-ambiente-' . bin2hex(random_bytes(4));
  $probeCleanup = static function () use ($probeDir): void {
    if (!is_dir($probeDir)) {
      return;
    }
    foreach (scandir($probeDir) ?: [] as $entry) {
      if ($entry === '.' || $entry === '..') {
        continue;
      }
      $path = $probeDir . DIRECTORY_SEPARATOR . $entry;
      if (is_file($path)) {
        @unlink($path);
      }
    }
    @rmdir($probeDir);
  };

  try {
    if (!@mkdir($probeDir, 0755, true) && !is_dir($probeDir)) {
      throw new RuntimeException('Não foi possível criar pasta de teste na raiz do site');
    }
    $add('mkdir_root', true, 'Criar pastas', 'PHP conseguiu criar uma pasta temporária na raiz');

    $rootWrite = file_put_contents($probeDir . DIRECTORY_SEPARATOR . 'write-test.txt', 'ok') !== false;
    $add(
      'write_root',
      $rootWrite,
      'Gravar arquivos na raiz',
      $rootWrite ? 'OK' : 'Sem permissão de escrita na raiz (bio.json / bio.draft.json)',
    );
  } catch (Throwable $e) {
    $add('mkdir_root', false, 'Criar pastas', $e->getMessage());
    $add('write_root', false, 'Gravar arquivos na raiz', 'Teste não executado');
    $probeCleanup();
    return $checks;
  }

  $assetsDir = $root . DIRECTORY_SEPARATOR . 'assets';
  $assetsExisted = is_dir($assetsDir);
  if (!$assetsExisted && !@mkdir($assetsDir, 0755, true) && !is_dir($assetsDir)) {
    $add('mkdir_assets', false, 'Pasta assets/', 'Não foi possível criar assets/');
    $add('write_assets', false, 'Upload em assets/', 'Teste não executado');
    $probeCleanup();
    return $checks;
  }

  $assetsWritable = is_writable($assetsDir);
  $add(
    'mkdir_assets',
    $assetsWritable,
    'Pasta assets/',
    $assetsExisted
      ? ($assetsWritable ? 'Existe e é gravável' : 'Existe, mas o PHP não consegue gravar')
      : ($assetsWritable ? 'Criada com sucesso e gravável' : 'Criada, mas sem permissão de escrita'),
  );

  $assetFile = $assetsDir . DIRECTORY_SEPARATOR . '.probe-upload-' . bin2hex(random_bytes(4)) . '.bin';
  $binary = str_repeat('A', 64 * 1024);
  $assetWrite = file_put_contents($assetFile, $binary) !== false;
  if ($assetWrite) {
    @unlink($assetFile);
  }
  $add(
    'write_assets',
    $assetWrite,
    'Simular upload (assets/)',
    $assetWrite
      ? 'PHP gravou e removeu um arquivo de teste em assets/'
      : 'Sem permissão para enviar imagens/vídeos pelo editor',
  );

  $editorDir = $root . DIRECTORY_SEPARATOR . 'editor';
  $editorOk = is_dir($editorDir) && is_file($editorDir . DIRECTORY_SEPARATOR . 'index.html');
  $add(
    'editor_present',
    $editorOk,
    'Pasta do editor',
    $editorOk ? 'editor/ encontrado' : 'Falta a pasta editor/ — confira se extraiu o ZIP completo',
    !$editorOk,
  );

  $probeCleanup();
  return $checks;
}

/**
 * @return list<array{id: string, ok: bool, label: string, detail: string, warning?: bool}>
 */
function client_license_environment_checks(string $root): array
{
  $checks = [];

  $add = static function (
    string $id,
    bool $ok,
    string $label,
    string $detail,
    bool $warning = false,
  ) use (&$checks): void {
    $checks[] = [
      'id' => $id,
      'ok' => $ok,
      'label' => $label,
      'detail' => $detail,
      'warning' => $warning,
    ];
  };

  $licensePhp = $root . DIRECTORY_SEPARATOR . 'client-license.php';
  $configPhp = $root . DIRECTORY_SEPARATOR . 'license.config.php';
  $gatePhp = $root . DIRECTORY_SEPARATOR . 'index.php';

  $gateOk = is_file($gatePhp) && is_file($licensePhp) && is_file($configPhp);
  $add(
    'license_files',
    $gateOk,
    'Arquivos de licença',
    $gateOk
      ? 'index.php, client-license.php e license.config.php encontrados'
      : 'Faltam arquivos de licença — extraia o ZIP completo e não remova index.php',
  );

  if (!$gateOk) {
    return $checks;
  }

  require_once $licensePhp;
  $config = client_license_load_config();
  if ($config === null) {
    $add('license_config', false, 'Configuração da licença', 'license.config.php inválido ou incompleto');
    return $checks;
  }

  $add(
    'license_config',
    true,
    'Configuração da licença',
    'Slug registrado: ' . $config['slug'],
  );

  $currentHost = client_license_current_host();
  $allowedHost = $config['allowed_host'] ?? '';
  if ($allowedHost !== '') {
    $hostOk = client_license_host_matches($config);
    $add(
      'license_host',
      $hostOk,
      'Domínio autorizado',
      $hostOk
        ? 'Este domínio (' . $currentHost . ') corresponde ao cadastrado (' . $allowedHost . ')'
        : 'Domínio atual (' . ($currentHost !== '' ? $currentHost : 'desconhecido') . ') '
          . 'não é o autorizado (' . $allowedHost . ')',
    );
  } else {
    $add(
      'license_host',
      true,
      'Domínio autorizado',
      'Sem restrição de domínio (hospedagem na plataforma)',
      true,
    );
  }

  $pathOk = client_license_path_matches($config);
  $deploy = client_license_deploy_slug();
  $expectedPath = client_license_deploy_path_label((string) ($config['deploy_path'] ?? ''));
  if (!empty($config['selfhost'])) {
    $pathDetail = $pathOk
      ? 'Pasta atual "' . $deploy . '" corresponde à autorizada (' . $expectedPath . ')'
      : 'A pasta "' . $deploy . '" não corresponde à autorizada (' . $expectedPath . ') — '
        . 'extraia o ZIP no caminho cadastrado no painel';
  } else {
    $pathDetail = $pathOk
      ? 'Pasta "' . $deploy . '" corresponde ao slug registrado'
      : 'A pasta "' . $deploy . '" não corresponde ao slug "' . $config['slug'] . '"';
  }
  $add(
    'license_path',
    $pathOk,
    'Pasta da instalação',
    $pathDetail,
  );

  $probe = client_license_probe_remote($config);
  $add(
    'license_api',
    !empty($probe['ok']),
    'Comunicação com a API de licença',
    !empty($probe['ok'])
      ? 'API respondeu (HTTP ' . (int) $probe['http_status'] . ') — ' . $probe['message']
      : $probe['message'],
  );

  if (!empty($probe['ok'])) {
    $active = !empty($probe['active']);
    $add(
      'license_active',
      $active,
      'Status da licença',
      $active
        ? 'Licença ativa — a bio pode funcionar neste domínio/pasta'
        : 'Conta suspensa ou inativa no painel — a bio não carregará para visitantes',
    );
  } else {
    $add(
      'license_active',
      false,
      'Status da licença',
      'Não foi possível confirmar o status — corrija a comunicação com a API primeiro',
    );
  }

  return $checks;
}

function ini_parse_size(string $value): int
{
  $value = trim($value);
  if ($value === '' || $value === '-1') {
    return PHP_INT_MAX;
  }
  $unit = strtolower(substr($value, -1));
  $number = (float) $value;
  return match ($unit) {
    'g' => (int) ($number * 1024 * 1024 * 1024),
    'm' => (int) ($number * 1024 * 1024),
    'k' => (int) ($number * 1024),
    default => (int) $number,
  };
}

/**
 * @param list<array{id: string, ok: bool, label: string, detail: string, warning?: bool}> $checks
 */
function client_environment_all_ok(array $checks): bool
{
  foreach ($checks as $check) {
    if (!empty($check['warning'])) {
      continue;
    }
    if (!$check['ok']) {
      return false;
    }
  }
  return true;
}

$root = __DIR__;
$checks = array_merge(client_environment_checks($root), client_license_environment_checks($root));
$allOk = client_environment_all_ok($checks);

if (isset($_GET['json'])) {
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(
    [
      'ok' => $allOk,
      'php' => PHP_VERSION,
      'checks' => $checks,
    ],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT,
  );
  exit;
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verificar ambiente — Links na Bio</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      line-height: 1.5;
      max-width: 40rem;
      margin: 2.5rem auto;
      padding: 0 1rem 3rem;
      color: #1a1a1a;
      background: #fafafa;
    }
    h1 { font-size: 1.35rem; margin-bottom: 0.25rem; }
    .lead { color: #555; margin-top: 0; }
    .status {
      margin: 1.25rem 0;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      font-weight: 600;
    }
    .status.ok { background: #e8f7ee; color: #0d6b3a; border: 1px solid #b8e6c8; }
    .status.fail { background: #fdecea; color: #b42318; border: 1px solid #f5c2c0; }
    ul { list-style: none; padding: 0; margin: 0; }
    li {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 0.85rem 0;
      border-bottom: 1px solid #e8e8e8;
    }
    .mark {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .mark.ok { background: #d1fae5; color: #047857; }
    .mark.fail { background: #fee2e2; color: #b91c1c; }
    .mark.warn { background: #fef3c7; color: #b45309; }
    .label { font-weight: 600; }
    .detail { font-size: 0.9rem; color: #666; margin-top: 0.15rem; }
    .foot { margin-top: 1.5rem; font-size: 0.85rem; color: #777; }
    code { font-size: 0.85em; }
  </style>
</head>
<body>
  <h1>Verificação do servidor</h1>
  <p class="lead">Use esta página após extrair o ZIP do cliente e antes de publicar a bio. Ela testa servidor, domínio, pasta e comunicação com a API de licença.</p>

  <div class="status <?= $allOk ? 'ok' : 'fail' ?>">
    <?= $allOk
      ? 'Ambiente apto para rodar o projeto.'
      : 'Corrija os itens em vermelho antes de usar o editor e a bio pública.' ?>
  </div>

  <ul>
    <?php foreach ($checks as $check): ?>
      <?php
        $isWarning = !empty($check['warning']);
        $markClass = $check['ok'] ? ($isWarning ? 'warn' : 'ok') : 'fail';
        $symbol = $check['ok'] ? ($isWarning ? '!' : '✓') : '✗';
      ?>
      <li>
        <span class="mark <?= $markClass ?>"><?= $symbol ?></span>
        <div>
          <div class="label"><?= htmlspecialchars($check['label'], ENT_QUOTES, 'UTF-8') ?></div>
          <div class="detail"><?= htmlspecialchars($check['detail'], ENT_QUOTES, 'UTF-8') ?></div>
        </div>
      </li>
    <?php endforeach; ?>
  </ul>

  <p class="foot">
    Resposta em JSON: <code>?json=1</code>.
    Por segurança, remova <code>verificar-ambiente.php</code> do servidor após validar.
  </p>
</body>
</html>
