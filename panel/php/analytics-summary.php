<?php
/**
 * Relatório resumido de analytics (editor autenticado via slug+token).
 * POST|GET /panel/api/analytics/summary
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

  $range = analytics_reports_parse_range($input, 7);
  $prev = analytics_reports_previous_range($range);

  $period = analytics_reports_period_stats($pdo, $clientId, $range['fromDt'], $range['toDt']);
  $previous = analytics_reports_period_stats($pdo, $clientId, $prev['fromDt'], $prev['toDt']);

  $todayLocal = new DateTimeImmutable('today', new DateTimeZone(analytics_display_offset()));
  $todayRange = analytics_reports_range_from_local($todayLocal, $todayLocal, 1);
  $todayStats = analytics_reports_period_stats(
    $pdo,
    $clientId,
    $todayRange['fromDt'],
    $todayRange['toDt'],
  );

  $topClick = analytics_reports_top_click($pdo, $clientId, $range['fromDt'], $range['toDt']);

  analytics_reports_send_json([
    'ok' => true,
    'from' => $range['from'],
    'to' => $range['to'],
    'period' => $period,
    'previous' => $previous,
    'delta' => [
      'pageviews' => analytics_reports_delta($period['pageviews'], $previous['pageviews']),
      'uniques' => analytics_reports_delta($period['uniques'], $previous['uniques']),
      'clicks' => analytics_reports_delta($period['clicks'], $previous['clicks']),
    ],
    'today' => $todayStats,
    'top_click' => $topClick,
  ]);
} catch (InvalidArgumentException $e) {
  analytics_reports_send_json(['ok' => false, 'error' => $e->getMessage()], 400);
} catch (Throwable $e) {
  platform_capture_exception($e, [
    'endpoint' => 'analytics/summary',
    'slug' => $auth['slug'] ?? null,
    'error' => $e->getMessage(),
  ]);
  analytics_reports_send_json(['ok' => false, 'error' => 'Erro ao montar resumo'], 500);
}
