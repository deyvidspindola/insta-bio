<?php

namespace App\UseCases\BioForm;

use App\Models\Bio;
use App\Repositories\BioFormRepository;
use App\Repositories\BioRepository;

/**
 * Retorna a definição publicada de um formulário para a bio pública.
 */
final class ShowPublicBioForm
{
    public function __construct(
        private BioRepository $bios,
        private BioFormRepository $forms,
    ) {}

    /**
     * @return array<string, mixed>|null
     */
    public function execute(string $analyticsKey, string $formSlug): ?array
    {
        $bio = $this->bios->findByAnalyticsKey($analyticsKey);
        if (! $bio instanceof Bio || ! $bio->isActive()) {
            return null;
        }

        $form = $this->forms->findPublishedBySlug($bio, $formSlug);
        if ($form === null || ! is_array($form->json_published)) {
            return null;
        }

        $published = $form->json_published;

        return [
            'slug' => $form->slug,
            'title' => $form->title,
            'description' => is_string($published['description'] ?? null) ? $published['description'] : '',
            'fields' => is_array($published['fields'] ?? null) ? array_values($published['fields']) : [],
            'submitLabel' => is_string($published['submitLabel'] ?? null) ? $published['submitLabel'] : 'Enviar',
            'successMessage' => is_string($published['successMessage'] ?? null)
                ? $published['successMessage']
                : 'Recebemos sua mensagem. Obrigado!',
        ];
    }
}
