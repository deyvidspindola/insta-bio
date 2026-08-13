<?php

namespace App\UseCases\PublicBio;

use App\Services\PublicBioPresenter;

/**
 * JSON publicado da bio (preview e página pública).
 */
final class GetPublishedBioJson
{
    public function __construct(
        private ShowPublicBio $show,
        private PublicBioPresenter $presenter,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(string $slug): array
    {
        return $this->presenter->published($this->show->require($slug));
    }
}
