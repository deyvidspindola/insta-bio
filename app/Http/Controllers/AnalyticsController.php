<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsPayloadDecoder;
use App\UseCases\Analytics\GetAnalyticsClicks;
use App\UseCases\Analytics\GetAnalyticsSummary;
use App\UseCases\Analytics\GetAnalyticsTimeseries;
use App\UseCases\Analytics\TrackEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Tracking público e relatórios do dono da bio.
 */
class AnalyticsController extends Controller
{
    /**
     * Recebe pageview/clique da bio pública.
     */
    public function track(Request $request, TrackEvent $useCase, AnalyticsPayloadDecoder $decoder): JsonResponse
    {
        $useCase->execute($decoder->fromRequest($request), $request->path(), $request->headers->get('referer'));

        return response()->json(['ok' => true]);
    }

    /**
     * Resumo do período.
     */
    public function summary(Request $request, GetAnalyticsSummary $useCase): JsonResponse
    {
        return response()->json($useCase->execute(
            $this->actor($request),
            $this->queryString($request, 'from'),
            $this->queryString($request, 'to'),
        ));
    }

    /**
     * Série temporal.
     */
    public function timeseries(Request $request, GetAnalyticsTimeseries $useCase): JsonResponse
    {
        return response()->json($useCase->execute(
            $this->actor($request),
            $this->queryString($request, 'from'),
            $this->queryString($request, 'to'),
        ));
    }

    /**
     * Ranking de cliques.
     */
    public function clicks(Request $request, GetAnalyticsClicks $useCase): JsonResponse
    {
        return response()->json($useCase->execute(
            $this->actor($request),
            $this->queryString($request, 'from'),
            $this->queryString($request, 'to'),
        ));
    }

    /**
     * Query string opcional, ignorando arrays.
     */
    private function queryString(Request $request, string $key): ?string
    {
        $value = $request->query($key);

        return is_string($value) ? $value : null;
    }
}
