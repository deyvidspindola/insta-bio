<?php

namespace App\UseCases\BioPage;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\BioPageRepository;
use App\Services\CurrentBioService;

/**
 * Remove uma página interna da bio.
 */
final class DeleteBioPage
{
    public function __construct(
        private CurrentBioService $currentBio,
        private BioPageRepository $pages,
    ) {}

    public function execute(User $user, string $slug): void
    {
        $bio = $this->currentBio->require($user);
        $page = $this->pages->findBySlug($bio, $slug);
        if ($page === null) {
            throw new ApplicationException('Página não encontrada.', 404);
        }

        $this->pages->delete($page);
    }
}
