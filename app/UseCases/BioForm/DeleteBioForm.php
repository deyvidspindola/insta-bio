<?php

namespace App\UseCases\BioForm;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\BioFormRepository;
use App\Services\CurrentBioService;

/**
 * Remove um formulário da bio.
 */
final class DeleteBioForm
{
    public function __construct(
        private CurrentBioService $currentBio,
        private BioFormRepository $forms,
    ) {}

    public function execute(User $user, string $slug): void
    {
        $bio = $this->currentBio->require($user);
        $form = $this->forms->findBySlug($bio, $slug);
        if ($form === null) {
            throw new ApplicationException('Formulário não encontrado.', 404);
        }

        $this->forms->delete($form);
    }
}
