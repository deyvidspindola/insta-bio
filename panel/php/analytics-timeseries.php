<?php
/**
 * Série temporal de analytics.
 * POST|GET /panel/api/analytics/timeseries?from=&to=&grain=day|hour
 */
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/lib/platform.php';
require __DIR__ . '/lib/analytics-reports.php';

analytics_reports_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
  analytics_reports_send_json(['ok' => false, 'error' => 'Método não permitido'], 405);
  exit;
}

try {
  $auth = analytics_reports_require_client();
  /** @var PDO $pdo */
  $pdo = $auth['pdo'];
  $clientId = $auth['id'];
  $input = $auth['input'];

  $grain = trim((string) ($input['grain'] ?? 'day'));
  if (!in_array($grain, ['day', 'hour'], true)) {
    throw new InvalidArgumentException('grain deve ser day ou hour');
  }

  $range = analytics_reports_parse_range($input, 7);
  $prev = analytics_reports_previous_range($range);

  if ($grain === 'hour') {
    $current = analytics_reports_timeseries_hour($pdo, $clientId, $range['fromDt'], $range['toDt']);
    $previous = analytics_reports_timeseries_hour($pdo, $clientId, $prev['fromDt'], $prev['toDt']);
  } else {
    $current = analytics_reports_timeseries_day($pdo, $clientId, $range['fromDt'], $range['toDt']);
    $previous = analytics_reports_timeseries_day($pdo, $clientId, $prev['fromDt'], $prev['toDt']);
  }

  analytics_reports_send_json([
    'ok' => true,
    'from' => $range['from'],
    'to' => $range['to'],
    'grain' => $grain,
    'current' => $current,
    'previous' => $previous,
  ]);
} catch (InvalidArgumentException $e) {
  analytics_reports_send_json(['ok' => false, 'error' => $e->getMessage()], 400);
} catch (Throwable $e) {
  platform_capture_exception($e);
  analytics_reports_send_json(['ok' => false, 'error' => 'Erro ao montar série'], 500);
}
