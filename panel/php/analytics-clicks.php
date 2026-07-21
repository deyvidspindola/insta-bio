<?php
/**
 * Ranking de cliques.
 * POST|GET /panel/api/analytics/clicks?from=&to=&limit=20
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
  $limit = (int) ($input['limit'] ?? 20);

  $items = analytics_reports_click_ranking($pdo, $clientId, $range['fromDt'], $range['toDt'], $limit);

  analytics_reports_send_json([
    'ok' => true,
    'from' => $range['from'],
    'to' => $range['to'],
    'items' => $items,
  ]);
} catch (InvalidArgumentException $e) {
  analytics_reports_send_json(['ok' => false, 'error' => $e->getMessage()], 400);
} catch (Throwable $e) {
  platform_capture_exception($e);
  analytics_reports_send_json(['ok' => false, 'error' => 'Erro ao montar ranking'], 500);
}
