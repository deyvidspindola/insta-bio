<?php

namespace App\Services;

use App\Models\Bio;
use InvalidArgumentException;

/**
 * Regras e limites dos planos Free e Pro.
 */
class PlanGate
{
    /**
     * Limites configurados para o plano.
     *
     * @return array<string, mixed>
     */
    public function limits(string $plan): array
    {
        $limits = config('linksnabio.plans.'.$plan);
        if (! is_array($limits)) {
            throw new InvalidArgumentException("Plano inválido: {$plan}");
        }

        return $limits;
    }

    /**
     * Impede save/publish acima do limite de links ou layout Pro.
     *
     * @param  array<string, mixed>  $config
     */
    public function assertCanSave(Bio $bio, array $config): void
    {
        $limits = $this->limits($bio->plan);
        $links = $this->countLinks($config);

        if (is_int($limits['max_links']) && $links > $limits['max_links']) {
            throw new PlanLimitException(
                "O plano Free permite no máximo {$limits['max_links']} links. Faça upgrade para o Pro."
            );
        }

        $template = data_get($config, 'brand.template', 'classic');
        $allowed = $limits['templates'] ?? [];
        if (is_array($allowed) && $allowed !== [] && ! in_array($template, $allowed, true)) {
            throw new PlanLimitException('Este layout está disponível apenas no plano Pro.');
        }
    }

    /**
     * Impede domínio próprio no plano Free.
     */
    public function assertCanUseCustomDomain(Bio $bio): void
    {
        if (! ($this->limits($bio->plan)['custom_domain'] ?? false)) {
            throw new PlanLimitException('Domínio próprio está disponível apenas no plano Pro.', 403);
        }
    }

    /**
     * Impede upload acima da cota de arquivos ou tamanho.
     */
    public function assertCanUpload(Bio $bio, int $fileSize, int $currentCount): void
    {
        $limits = $this->limits($bio->plan);

        if (is_int($limits['max_images']) && $currentCount >= $limits['max_images']) {
            throw new PlanLimitException("O plano atual permite no máximo {$limits['max_images']} imagens.");
        }

        if (is_int($limits['max_image_bytes']) && $fileSize > $limits['max_image_bytes']) {
            $mb = (int) ($limits['max_image_bytes'] / 1024 / 1024);
            throw new PlanLimitException("Cada arquivo pode ter no máximo {$mb} MB neste plano.");
        }
    }

    /**
     * Janela máxima de analytics em dias para o plano.
     */
    public function analyticsDays(Bio $bio): int
    {
        return (int) ($this->limits($bio->plan)['analytics_days'] ?? 7);
    }

    /**
     * Conta itens que se comportam como link no JSON da bio.
     *
     * @param  array<string, mixed>  $config
     */
    public function countLinks(array $config): int
    {
        $count = 0;
        foreach ($config['sections'] ?? [] as $section) {
            if (! is_array($section)) {
                continue;
            }
            foreach ($section['items'] ?? [] as $item) {
                if (is_array($item) && $this->itemIsLink($item)) {
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function itemIsLink(array $item): bool
    {
        $type = $item['type'] ?? '';
        if (in_array($type, ['text', 'list'], true)) {
            return false;
        }

        foreach (['href', 'url', 'whatsapp', 'link'] as $key) {
            if (! empty($item[$key])) {
                return true;
            }
        }

        if (! empty($item['action']['href'])) {
            return true;
        }

        return in_array($type, ['link', 'feature', 'app-hero', 'whatsapp-hero', 'press'], true);
    }
}
