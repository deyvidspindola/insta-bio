<?php

namespace App\UseCases\BioForm;

use App\Models\BioForm;
use App\Models\User;
use App\Repositories\BioFormRepository;
use App\Services\CurrentBioService;

/**
 * Lista formulários da bio do usuário.
 */
final class ListBioForms
{
    use SerializesBioForm;

    public function __construct(
        private CurrentBioService $currentBio,
        private BioFormRepository $forms,
    ) {}

    /**
     * @return array{forms: list<array<string, mixed>>}
     */
    public function execute(User $user): array
    {
        $bio = $this->currentBio->require($user);

        return [
            'forms' => $this->forms->listForBio($bio)
                ->map(fn (BioForm $form) => $this->toArray($form))
                ->values()
                ->all(),
        ];
    }
}
