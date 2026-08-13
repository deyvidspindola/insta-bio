<?php

namespace App\Http\Middleware;

use App\Repositories\CustomDomainRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolve o host da requisição para uma bio com domínio próprio verificado.
 */
class ResolveTenantHost
{
    public function __construct(private CustomDomainRepository $domains) {}

    /**
     * Anexa `tenant_bio` na request quando o host não é o da plataforma.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $host = strtolower($request->getHost());
        $platform = strtolower((string) config('linksnabio.platform_host'));

        if ($host === $platform || str_starts_with($host, 'localhost') || $host === '127.0.0.1') {
            return $next($request);
        }

        $domain = $this->domains->findVerifiedByHost($host);
        if ($domain?->bio) {
            $request->attributes->set('tenant_bio', $domain->bio);
        }

        return $next($request);
    }
}
