<?php

namespace App\UseCases\BioForm;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\BioFormRepository;
use App\Services\CurrentBioService;

/**
 * Publica o rascunho do formulário.
 */
final class PublishBioForm
{
    use SerializesBioForm;

    public function __construct(
        private CurrentBioService $currentBio,
        private BioFormRepository $forms,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user, string $slug): array
    {
        $bio = $this->currentBio->require($user);
        $form = $this->forms->findBySlug($bio, $slug);
        if ($form === null) {
            throw new ApplicationException('Formulário não encontrado.', 404);
        }

        $draft = is_array($form->json_draft) ? $form->json_draft : $this->defaultDraft();
        $form = $this->forms->update($form, [
            'json_published' => $draft,
            'status' => 'published',
        ]);

        return $this->toArray($form);
    }
}
