<?php

namespace App\Services;

use App\Models\CustomDomain;

/**
 * Verifica CNAME ou TXT do domínio próprio da bio.
 */
class DomainVerificationService
{
    /**
     * Host de destino do CNAME (plataforma).
     */
    public function cnameTarget(): string
    {
        return (string) config('linksnabio.cname_target');
    }

    /**
     * Marca o domínio como verificado se CNAME ou TXT bater.
     */
    public function verify(CustomDomain $domain): bool
    {
        $host = $domain->domain;
        $target = $this->cnameTarget();
        $txtName = '_linksnabio.'.$host;
        $expectedTxt = 'linksnabio-verify='.$domain->verification_token;

        $cnameOk = $this->recordsContain($host, DNS_CNAME, $target);
        $txtOk = $this->recordsContain($txtName, DNS_TXT, $expectedTxt);

        if ($cnameOk || $txtOk) {
            $domain->update(['verified_at' => now()]);

            return true;
        }

        return false;
    }

    /**
     * Consulta DNS e procura o valor esperado no registro.
     */
    private function recordsContain(string $host, int $type, string $needle): bool
    {
        $records = @dns_get_record($host, $type);
        if (! is_array($records)) {
            return false;
        }

        $needle = strtolower(rtrim($needle, '.'));

        foreach ($records as $record) {
            $value = strtolower(rtrim((string) ($record['target'] ?? $record['txt'] ?? ''), '.'));
            if ($value !== '' && str_contains($value, $needle)) {
                return true;
            }
        }

        return false;
    }
}
