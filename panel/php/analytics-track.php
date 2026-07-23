<?php
/**
 * Ingestão pública de analytics (pageview / click).
 * Auth: analytics_key (UUID) — nunca license_token.
 */
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/license.php';
require __DIR__ . '/lib/analytics.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Método não permitido']);
  exit;
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 4096) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Payload inválido ou grande demais']);
  exit;
}

try {
  $input = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
  if (!is_array($input)) {
    throw new InvalidArgumentException('JSON inválido');
  }

  $analyticsKey = strtolower(trim((string) ($input['analytics_key'] ?? '')));
  $eventType = trim((string) ($input['event_type'] ?? ''));
  $occurredAtRaw = trim((string) ($input['occurred_at'] ?? ''));
  $visitorId = trim((string) ($input['visitor_id'] ?? ''));
  $sessionId = trim((string) ($input['session_id'] ?? ''));
  $path = mb_substr(trim((string) ($input['path'] ?? '/')), 0, 255);
  $referrer = mb_substr(trim((string) ($input['referrer'] ?? '')), 0, 512);
  $meta = is_array($input['meta'] ?? null) ? $input['meta'] : [];

  if ($analyticsKey === '' || !is_valid_uuid($analyticsKey)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'analytics_key inválida']);
    exit;
  }

  if (!in_array($eventType, ['pageview', 'click'], true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'event_type inválido']);
    exit;
  }

  $ua = analytics_request_user_agent();
  if (analytics_is_bot_user_agent($ua)) {
    echo json_encode(['ok' => true, 'skipped' => 'bot']);
    exit;
  }

  $pdo = platform_db();
  platform_ensure_analytics_schema($pdo);

  $client = lookup_client_by_analytics_key($pdo, $analyticsKey);

  // Proxy self-hosted: license.config pode ter ANALYTICS_KEY órfã (não está no MySQL).
  // Nesse caso resolve pelo mesmo slug+token do license-check.
  if (!$client) {
    $proxySlug = normalize_slug(platform_input_string($input['license_slug'] ?? '', 40));
    $proxyToken = platform_input_token($input['license_token'] ?? '');
    $proxyDeploy = normalize_slug(platform_input_string($input['license_deploy'] ?? '', 40));
    $proxyHost = normalize_license_host(platform_input_string($input['license_host'] ?? '', 255));

    if ($proxySlug !== '' && $proxyToken !== '') {
      $client = lookup_client_license($pdo, $proxySlug, $proxyToken, $proxyDeploy, $proxyHost);
      if ($client) {
        ensure_client_analytics_key($pdo, $client);
      }
    }
  }

  if (!$client) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Cliente não encontrado']);
    exit;
  }

  if (($client['status'] ?? '') !== 'active') {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Cliente inativo']);
    exit;
  }

  try {
    $occurred = $occurredAtRaw !== ''
      ? new DateTimeImmutable($occurredAtRaw)
      : new DateTimeImmutable('now');
  } catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'occurred_at inválido']);
    exit;
  }

  $now = new DateTimeImmutable('now');
  if ($occurred > $now->modify('+10 minutes')) {
    $occurred = $now;
  }
  $occurredMysql = $occurred->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');

  if ($visitorId !== '' && !is_valid_uuid($visitorId)) {
    $visitorId = '';
  }
  if ($sessionId !== '' && !is_valid_uuid($sessionId)) {
    $sessionId = '';
  }

  $ip = analytics_client_ip();
  if (!analytics_rate_limit_allow($ip . ':' . $analyticsKey, 120, 60)) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Rate limit excedido']);
    exit;
  }

  $sectionId = null;
  $itemIndex = null;
  $itemType = null;
  $label = null;
  $targetUrl = null;

  if ($eventType === 'click') {
    $sectionId = mb_substr(trim((string) ($meta['section_id'] ?? '')), 0, 80) ?: null;
    $itemType = mb_substr(trim((string) ($meta['item_type'] ?? '')), 0, 40) ?: null;
    $label = mb_substr(trim((string) ($meta['label'] ?? '')), 0, 160) ?: null;
    $targetUrl = mb_substr(trim((string) ($meta['url'] ?? '')), 0, 1024) ?: null;

    if (array_key_exists('item_index', $meta) && $meta['item_index'] !== null && $meta['item_index'] !== '') {
      $itemIndex = max(0, min(65535, (int) $meta['item_index']));
    }

    if ($targetUrl === null || $targetUrl === '') {
      http_response_code(400);
      echo json_encode(['ok' => false, 'error' => 'meta.url obrigatório para click']);
      exit;
    }
  }

  platform_db_execute(
    $pdo,
    'INSERT INTO analytics_events (
      client_id, slug, event_type, occurred_at, visitor_id, session_id,
      path, referrer, section_id, item_index, item_type, label, target_url,
      ip_hash, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      (int) $client['id'],
      (string) $client['slug'],
      $eventType,
      $occurredMysql,
      $visitorId !== '' ? $visitorId : null,
      $sessionId !== '' ? $sessionId : null,
      $path !== '' ? $path : null,
      $referrer !== '' ? $referrer : null,
      $sectionId,
      $itemIndex,
      $itemType,
      $label,
      $targetUrl,
      analytics_ip_hash($ip),
      $ua !== '' ? $ua : null,
    ],
  );

  echo json_encode(['ok' => true, 'inserted' => true, 'event_type' => $eventType]);
} catch (JsonException $e) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'JSON inválido']);
} catch (InvalidArgumentException $e) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
} catch (Throwable $e) {
  platform_capture_exception($e, [
    'endpoint' => 'analytics/track',
    'event_type' => $eventType ?? null,
    'error' => $e->getMessage(),
  ]);
  http_response_code(503);
  echo json_encode(['ok' => false, 'error' => 'Erro ao registrar evento']);
}
