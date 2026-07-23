<?php

function generate_uuid_v4(): string
{
  $bytes = random_bytes(16);
  $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
  $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);

  $hex = bin2hex($bytes);
  return sprintf(
    '%s-%s-%s-%s-%s',
    substr($hex, 0, 8),
    substr($hex, 8, 4),
    substr($hex, 12, 4),
    substr($hex, 16, 4),
    substr($hex, 20, 12),
  );
}

function is_valid_uuid(string $value): bool
{
  return (bool) preg_match(
    '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
    $value,
  );
}

function platform_ensure_analytics_schema(PDO $pdo): void
{
  static $done = false;
  if ($done) {
    return;
  }
  $done = true;

  platform_ensure_license_column($pdo);

  $stmt = $pdo->query("SHOW COLUMNS FROM clients LIKE 'analytics_key'");
  if (!$stmt->fetch()) {
    $pdo->exec(
      "ALTER TABLE clients ADD COLUMN analytics_key CHAR(36) NULL UNIQUE COMMENT 'UUID v4 para ingestão pública de analytics' AFTER license_token",
    );
  }

  $pdo->exec(
    "CREATE TABLE IF NOT EXISTS analytics_events (
      id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      client_id     INT UNSIGNED NOT NULL,
      slug          VARCHAR(40) NULL,
      event_type    ENUM('pageview', 'click') NOT NULL,
      occurred_at   DATETIME NOT NULL,
      visitor_id    CHAR(36) NULL,
      session_id    CHAR(36) NULL,
      path          VARCHAR(255) NULL,
      referrer      VARCHAR(512) NULL,
      section_id    VARCHAR(80) NULL,
      item_index    SMALLINT UNSIGNED NULL,
      item_type     VARCHAR(40) NULL,
      label         VARCHAR(160) NULL,
      target_url    VARCHAR(1024) NULL,
      ip_hash       CHAR(64) NULL,
      user_agent    VARCHAR(255) NULL,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_client_time (client_id, occurred_at),
      INDEX idx_type_time (event_type, occurred_at),
      INDEX idx_visitor_day (client_id, event_type, visitor_id, occurred_at),
      CONSTRAINT fk_analytics_client FOREIGN KEY (client_id) REFERENCES clients(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  );

  $missing = $pdo->query(
    'SELECT id FROM clients WHERE analytics_key IS NULL OR analytics_key = \'\' LIMIT 200',
  );
  while ($row = $missing->fetch()) {
    platform_db_execute(
      $pdo,
      'UPDATE clients SET analytics_key = ? WHERE id = ? AND (analytics_key IS NULL OR analytics_key = \'\')',
      [generate_uuid_v4(), (int) $row['id']],
    );
  }
}

/**
 * Garante analytics_key no cliente; atualiza o banco se estiver vazio.
 * @param array{id?: int|string, analytics_key?: string|null} $client
 */
function ensure_client_analytics_key(PDO $pdo, array &$client): string
{
  platform_ensure_analytics_schema($pdo);

  $key = trim((string) ($client['analytics_key'] ?? ''));
  if ($key !== '' && is_valid_uuid($key)) {
    return strtolower($key);
  }

  $key = generate_uuid_v4();
  $id = (int) ($client['id'] ?? 0);
  if ($id > 0) {
    platform_db_execute(
      $pdo,
      'UPDATE clients SET analytics_key = ? WHERE id = ?',
      [$key, $id],
    );
  }
  $client['analytics_key'] = $key;
  return $key;
}

/**
 * Fuso de exibição dos relatórios. Eventos são gravados em UTC; a agregação por
 * dia/hora e a deduplicação "único por dia" usam este offset. America/Sao_Paulo
 * não tem horário de verão desde 2019, então um offset fixo é seguro e dispensa
 * as tabelas de timezone do MySQL (CONVERT_TZ com offset numérico sempre funciona).
 * Pode ser sobrescrito via constante ANALYTICS_DISPLAY_OFFSET (ex.: '-02:00').
 */
function analytics_display_offset(): string
{
  if (defined('ANALYTICS_DISPLAY_OFFSET')) {
    $custom = trim((string) ANALYTICS_DISPLAY_OFFSET);
    if (preg_match('/^[+-]\d{2}:\d{2}$/', $custom)) {
      return $custom;
    }
  }
  return '-03:00';
}

function analytics_track_url_from_license_api(string $licenseApi): string
{
  $api = rtrim(trim($licenseApi), '/');
  if ($api === '') {
    return '';
  }
  if (str_ends_with($api, '/api/license/check')) {
    return substr($api, 0, -strlen('/api/license/check')) . '/api/analytics/track';
  }
  if (preg_match('#/panel$#', $api)) {
    return $api . '/api/analytics/track';
  }
  return preg_replace('#/api/.*$#', '/api/analytics/track', $api) ?: ($api . '/api/analytics/track');
}

function analytics_client_ip(): string
{
  // Proxy same-origin do cliente (hospedagem externa) envia X-Forwarded-For.
  $xff = trim((string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''));
  if ($xff !== '') {
    $first = trim(explode(',', $xff)[0]);
    if ($first !== '' && filter_var($first, FILTER_VALIDATE_IP)) {
      return $first;
    }
  }

  $ip = trim((string) ($_SERVER['REMOTE_ADDR'] ?? ''));
  return $ip !== '' ? $ip : '0.0.0.0';
}

/**
 * UA do visitante: preferir o encaminhado pelo proxy do cliente
 * (senão o painel só vê curl/ e descarta como bot).
 */
function analytics_request_user_agent(): string
{
  $forwarded = trim((string) ($_SERVER['HTTP_X_FORWARDED_USER_AGENT'] ?? ''));
  if ($forwarded !== '') {
    return mb_substr($forwarded, 0, 255);
  }

  return mb_substr(trim((string) ($_SERVER['HTTP_USER_AGENT'] ?? '')), 0, 255);
}

function analytics_ip_hash(string $ip): string
{
  $salt = '';
  if (defined('DB_PASS')) {
    $salt = (string) DB_PASS;
  }
  return hash('sha256', $ip . '|' . $salt);
}

/**
 * Rate limit simples por arquivo (HostGator / shared hosting).
 * @return true se permitido
 */
function analytics_rate_limit_allow(string $bucket, int $max = 60, int $windowSeconds = 60): bool
{
  $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'insta-bio-analytics-rl';
  if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
    return true;
  }

  $safe = preg_replace('/[^a-zA-Z0-9._-]/', '_', $bucket) ?: 'x';
  $file = $dir . DIRECTORY_SEPARATOR . $safe . '.json';
  $now = time();
  $fh = @fopen($file, 'c+');
  if ($fh === false) {
    return true;
  }

  try {
    if (!flock($fh, LOCK_EX)) {
      return true;
    }

    $raw = stream_get_contents($fh);
    $data = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
    $start = is_array($data) ? (int) ($data['start'] ?? $now) : $now;
    $count = is_array($data) ? (int) ($data['count'] ?? 0) : 0;

    if ($now - $start >= $windowSeconds) {
      $start = $now;
      $count = 0;
    }

    $count++;
    $allowed = $count <= $max;

    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode(['start' => $start, 'count' => $count], JSON_UNESCAPED_SLASHES));
    fflush($fh);
    flock($fh, LOCK_UN);

    return $allowed;
  } finally {
    fclose($fh);
  }
}

function analytics_is_bot_user_agent(?string $ua): bool
{
  $ua = strtolower(trim((string) $ua));
  if ($ua === '') {
    return true;
  }

  $needles = [
    'bot', 'crawl', 'spider', 'slurp', 'facebookexternalhit',
    'preview', 'headlesschrome', 'phantomjs', 'selenium',
    'curl/', 'wget/', 'python-requests', 'go-http-client',
  ];
  foreach ($needles as $needle) {
    if (str_contains($ua, $needle)) {
      return true;
    }
  }
  return false;
}

/**
 * @return array{id: int, slug: string, status: string}|null
 */
function lookup_client_by_analytics_key(PDO $pdo, string $analyticsKey): ?array
{
  platform_ensure_analytics_schema($pdo);

  if (!is_valid_uuid($analyticsKey)) {
    return null;
  }

  $stmt = platform_db_execute(
    $pdo,
    'SELECT id, slug, status FROM clients WHERE analytics_key = ? LIMIT 1',
    [strtolower($analyticsKey)],
  );
  $row = $stmt->fetch();
  return $row ?: null;
}
