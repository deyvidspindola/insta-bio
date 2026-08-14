<?php

namespace App\Services;

/**
 * Monta o JSON inicial da bio a partir do default em disco.
 */
class BioFactory
{
    /**
     * JSON padrão (arquivo em database/data ou fallback embutido).
     *
     * @return array<string, mixed>
     */
    public function defaultConfig(): array
    {
        $path = database_path('data/bio.default.json');
        if (! is_file($path)) {
            return $this->fallback();
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return is_array($decoded) ? $decoded : $this->fallback();
    }

    /**
     * JSON inicial com nome, template e overrides.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    public function make(string $name, string $template = 'classic', array $overrides = []): array
    {
        $config = array_replace_recursive($this->defaultConfig(), $overrides);
        $config['brand']['name'] = $name;
        $config['brand']['template'] = $template;
        $config['brand']['seo']['title'] = $name.' · Link da Bio';

        return $config;
    }

    /**
     * Estrutura mínima usada se o JSON default não existir.
     *
     * @return array<string, mixed>
     */
    private function fallback(): array
    {
        return [
            'brand' => [
                'name' => 'Minha Bio',
                'tagline' => '',
                'location' => '',
                'instagram' => ['handle' => '', 'url' => ''],
                'logo' => '',
                'theme' => [
                    'primary' => 'oklch(0.72 0.16 55)',
                    'glow' => 'oklch(0.70 0.18 55 / 0.28)',
                    'background' => '#ffffff',
                ],
                'template' => 'classic',
                'seo' => [
                    'title' => 'Link da Bio',
                    'description' => '',
                ],
                'footer' => '',
            ],
            'sections' => [
                [
                    'id' => 'links',
                    'title' => 'Links',
                    'hideTitle' => true,
                    'items' => [],
                ],
            ],
        ];
    }
}
