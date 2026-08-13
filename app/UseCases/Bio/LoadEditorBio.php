<?php

namespace App\UseCases\Bio;

use App\Models\User;
use App\Services\CurrentBioService;

/**
 * Carrega o JSON do editor (rascunho ou publicado).
 */
final class LoadEditorBio
{
    public function __construct(private CurrentBioService $currentBio) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(User $user): array
    {
        $bio = $this->currentBio->requireActive($user);
        $draft = $bio->json_draft;
        $published = $bio->json_published;
        $source = $draft ? 'draft' : ($published ? 'published' : 'none');

        return [
            'config' => $bio->editorConfig(),
            'source' => $source,
            'hasDraft' => $draft !== null && $draft !== $published,
            'slug' => $bio->slug,
            'plan' => $bio->plan,
            'publicUrl' => url('/'.$bio->slug),
        ];
    }
}
