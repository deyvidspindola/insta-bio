<?php

require_once __DIR__ . '/analytics.php';
require_once __DIR__ . '/license.php';

/**
 * Autentica cliente por slug+token (mesmo padrão de updates).
 * @return array{id: int, slug: string, status: string}
 */
function analytics_reports_require_client(): array
{
  $input = $_SERVER['REQUEST_METHOD'] === 'POST' ? platform_json_input() : $_GET;
  $slug = normalize_slug(platform_input_string($input['slug'] ?? '', 40));
  $token = platform_input_token($input['token'] ?? '');
  $deploy = normalize_slug(platform_input_string($input['deploy'] ?? '', 40));
  $host = normalize_license_host(platform_input_string($input['host'] ?? '', 255));

  if ($slug === '' || $token === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'slug e token são obrigatórios']);
    exit;
  }

  $pdo = platform_db();
  platform_ensure_analytics_schema($pdo);

  $client = lookup_client_license($pdo, $slug, $token, $deploy, $host);
  if (!$client) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Licença inválida']);
    exit;
  }

  if (($client['status'] ?? '') !== 'active') {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Conta suspensa', 'status' => $client['status']]);
    exit;
  }

  return [
    'id' => (int) $client['id'],
    'slug' => (string) $client['slug'],
    'status' => (string) $client['status'],
    'input' => $input,
    'pdo' => $pdo,
  ];
}

/**
 * @param array<string, mixed> $input
 * @return array{from: string, to: string, fromDt: string, toDt: string, days: int}
 */
function analytics_reports_parse_range(array $input, int $defaultDays = 7): array
{
  $toRaw = trim((string) ($input['to'] ?? ''));
  $fromRaw = trim((string) ($input['from'] ?? ''));

  $tz = new DateTimeZone('UTC');
  $to = $toRaw !== ''
    ? DateTimeImmutable::createFromFormat('Y-m-d', $toRaw, $tz)
    : new DateTimeImmutable('today', $tz);
  if ($to === false) {
    throw new InvalidArgumentException('Parâmetro to inválido (use Y-m-d)');
  }

  $from = $fromRaw !== ''
    ? DateTimeImmutable::createFromFormat('Y-m-d', $fromRaw, $tz)
    : $to->modify('-' . max(0, $defaultDays - 1) . ' days');
  if ($from === false) {
    throw new InvalidArgumentException('Parâmetro from inválido (use Y-m-d)');
  }

  if ($from > $to) {
    throw new InvalidArgumentException('from deve ser <= to');
  }

  $days = (int) $from->diff($to)->days + 1;
  if ($days > 366) {
    throw new InvalidArgumentException('Período máximo: 366 dias');
  }

  return [
    'from' => $from->format('Y-m-d'),
    'to' => $to->format('Y-m-d'),
    'fromDt' => $from->format('Y-m-d') . ' 00:00:00',
    'toDt' => $to->format('Y-m-d') . ' 23:59:59',
    'days' => $days,
  ];
}

/**
 * @return array{from: string, to: string, fromDt: string, toDt: string, days: int}
 */
function analytics_reports_previous_range(array $range): array
{
  $tz = new DateTimeZone('UTC');
  $from = new DateTimeImmutable($range['from'], $tz);
  $prevTo = $from->modify('-1 day');
  $prevFrom = $prevTo->modify('-' . ($range['days'] - 1) . ' days');

  return [
    'from' => $prevFrom->format('Y-m-d'),
    'to' => $prevTo->format('Y-m-d'),
    'fromDt' => $prevFrom->format('Y-m-d') . ' 00:00:00',
    'toDt' => $prevTo->format('Y-m-d') . ' 23:59:59',
    'days' => $range['days'],
  ];
}

function analytics_reports_delta(?int $current, ?int $previous): ?float
{
  $current = (int) $current;
  $previous = (int) $previous;
  if ($previous === 0) {
    return $current > 0 ? 1.0 : 0.0;
  }
  return round(($current - $previous) / $previous, 4);
}

/**
 * @return array{pageviews: int, uniques: int, clicks: int, ctr: float|null}
 */
function analytics_reports_period_stats(PDO $pdo, int $clientId, string $fromDt, string $toDt): array
{
  $stmt = platform_db_execute(
    $pdo,
    "SELECT
      SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
      COUNT(DISTINCT CASE WHEN event_type = 'pageview' AND visitor_id IS NOT NULL AND visitor_id != '' THEN visitor_id END) AS uniques,
      SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS clicks
     FROM analytics_events
     WHERE client_id = ? AND occurred_at BETWEEN ? AND ?",
    [$clientId, $fromDt, $toDt],
  );
  $row = $stmt->fetch() ?: [];
  $pageviews = (int) ($row['pageviews'] ?? 0);
  $clicks = (int) ($row['clicks'] ?? 0);
  $uniques = (int) ($row['uniques'] ?? 0);
  $ctr = $pageviews > 0 ? round($clicks / $pageviews, 4) : null;

  return [
    'pageviews' => $pageviews,
    'uniques' => $uniques,
    'clicks' => $clicks,
    'ctr' => $ctr,
  ];
}

/**
 * @return array{label: string|null, item_type: string|null, target_url: string|null, count: int}|null
 */
function analytics_reports_top_click(PDO $pdo, int $clientId, string $fromDt, string $toDt): ?array
{
  $stmt = platform_db_execute(
    $pdo,
    "SELECT label, item_type, target_url, COUNT(*) AS cnt
     FROM analytics_events
     WHERE client_id = ? AND event_type = 'click' AND occurred_at BETWEEN ? AND ?
     GROUP BY label, item_type, target_url
     ORDER BY cnt DESC
     LIMIT 1",
    [$clientId, $fromDt, $toDt],
  );
  $row = $stmt->fetch();
  if (!$row) {
    return null;
  }

  return [
    'label' => $row['label'] !== null && $row['label'] !== '' ? (string) $row['label'] : null,
    'item_type' => $row['item_type'] !== null ? (string) $row['item_type'] : null,
    'target_url' => $row['target_url'] !== null ? (string) $row['target_url'] : null,
    'count' => (int) $row['cnt'],
  ];
}

/**
 * @return list<array{bucket: string, pageviews: int, clicks: int}>
 */
function analytics_reports_timeseries_day(PDO $pdo, int $clientId, string $fromDt, string $toDt): array
{
  $stmt = platform_db_execute(
    $pdo,
    "SELECT DATE(occurred_at) AS bucket,
      SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
      SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS clicks
     FROM analytics_events
     WHERE client_id = ? AND occurred_at BETWEEN ? AND ?
     GROUP BY DATE(occurred_at)
     ORDER BY bucket ASC",
    [$clientId, $fromDt, $toDt],
  );

  $map = [];
  while ($row = $stmt->fetch()) {
    $map[(string) $row['bucket']] = [
      'bucket' => (string) $row['bucket'],
      'pageviews' => (int) $row['pageviews'],
      'clicks' => (int) $row['clicks'],
    ];
  }

  $tz = new DateTimeZone('UTC');
  $from = new DateTimeImmutable(substr($fromDt, 0, 10), $tz);
  $to = new DateTimeImmutable(substr($toDt, 0, 10), $tz);
  $out = [];
  for ($d = $from; $d <= $to; $d = $d->modify('+1 day')) {
    $key = $d->format('Y-m-d');
    $out[] = $map[$key] ?? ['bucket' => $key, 'pageviews' => 0, 'clicks' => 0];
  }
  return $out;
}

/**
 * @return list<array{bucket: string, pageviews: int, clicks: int}>
 */
function analytics_reports_timeseries_hour(PDO $pdo, int $clientId, string $fromDt, string $toDt): array
{
  $stmt = platform_db_execute(
    $pdo,
    "SELECT HOUR(occurred_at) AS hour_num,
      SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
      SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS clicks
     FROM analytics_events
     WHERE client_id = ? AND occurred_at BETWEEN ? AND ?
     GROUP BY HOUR(occurred_at)
     ORDER BY hour_num ASC",
    [$clientId, $fromDt, $toDt],
  );

  $map = [];
  while ($row = $stmt->fetch()) {
    $h = str_pad((string) (int) $row['hour_num'], 2, '0', STR_PAD_LEFT);
    $map[$h] = [
      'bucket' => $h,
      'pageviews' => (int) $row['pageviews'],
      'clicks' => (int) $row['clicks'],
    ];
  }

  $out = [];
  for ($h = 0; $h < 24; $h++) {
    $key = str_pad((string) $h, 2, '0', STR_PAD_LEFT);
    $out[] = $map[$key] ?? ['bucket' => $key, 'pageviews' => 0, 'clicks' => 0];
  }
  return $out;
}

/**
 * @return list<array{section_id: ?string, item_index: ?int, item_type: ?string, label: ?string, target_url: ?string, count: int, pct: float}>
 */
function analytics_reports_click_ranking(PDO $pdo, int $clientId, string $fromDt, string $toDt, int $limit = 20): array
{
  $limit = max(1, min(50, $limit));

  $totalStmt = platform_db_execute(
    $pdo,
    "SELECT COUNT(*) AS c FROM analytics_events
     WHERE client_id = ? AND event_type = 'click' AND occurred_at BETWEEN ? AND ?",
    [$clientId, $fromDt, $toDt],
  );
  $total = (int) (($totalStmt->fetch()['c'] ?? 0));

  $stmt = platform_db_execute(
    $pdo,
    "SELECT section_id, item_index, item_type, label, target_url, COUNT(*) AS cnt
     FROM analytics_events
     WHERE client_id = ? AND event_type = 'click' AND occurred_at BETWEEN ? AND ?
     GROUP BY section_id, item_index, item_type, label, target_url
     ORDER BY cnt DESC
     LIMIT {$limit}",
    [$clientId, $fromDt, $toDt],
  );

  $items = [];
  while ($row = $stmt->fetch()) {
    $count = (int) $row['cnt'];
    $items[] = [
      'section_id' => $row['section_id'] !== null && $row['section_id'] !== '' ? (string) $row['section_id'] : null,
      'item_index' => $row['item_index'] !== null ? (int) $row['item_index'] : null,
      'item_type' => $row['item_type'] !== null ? (string) $row['item_type'] : null,
      'label' => $row['label'] !== null && $row['label'] !== '' ? (string) $row['label'] : null,
      'target_url' => $row['target_url'] !== null ? (string) $row['target_url'] : null,
      'count' => $count,
      'pct' => $total > 0 ? round($count / $total, 4) : 0.0,
    ];
  }
  return $items;
}

function analytics_reports_send_json(array $payload, int $status = 200): void
{
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store, no-cache, must-revalidate');
  echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}

function analytics_reports_cors(): void
{
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}
