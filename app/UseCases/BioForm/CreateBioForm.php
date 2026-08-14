<?php

namespace App\UseCases\BioForm;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\BioFormRepository;
use App\Services\CurrentBioService;
use App\Services\SlugService;

/**
 * Cria um formulário reutilizável com campos padrão.
 */
final class CreateBioForm
{
    use SerializesBioForm;

    public function __construct(
        private CurrentBioService $currentBio,
        private BioFormRepository $forms,
        private SlugService $slugs,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user, string $title, ?string $slugInput): array
    {
        $bio = $this->currentBio->require($user);

        $raw = is_string($slugInput) && trim($slugInput) !== '' ? $slugInput : $title;
        $slug = $this->slugs->normalize($raw);
        $error = $this->slugs->validate($slug);
        if ($error !== null) {
            throw new ApplicationException($error, 422);
        }
        if ($this->forms->slugExistsForBio($bio, $slug)) {
            throw new ApplicationException('Este slug já está em uso nesta bio.', 422);
        }

        $form = $this->forms->create($bio, [
            'slug' => $slug,
            'title' => $title,
            'json_draft' => $this->defaultDraft(),
            'json_published' => null,
            'status' => 'draft',
        ]);

        return $this->toArray($form);
    }
}
