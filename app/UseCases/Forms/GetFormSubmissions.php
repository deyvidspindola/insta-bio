<?php

namespace App\UseCases\Forms;

use App\Models\User;
use App\Repositories\FormSubmissionRepository;
use App\Services\CurrentBioService;

/**
 * Lista respostas de formulários da bio do usuário.
 */
final class GetFormSubmissions
{
    public function __construct(
        private CurrentBioService $currentBio,
        private FormSubmissionRepository $submissions,
    ) {}

    /**
     * @return array{items: list<array<string, mixed>>, forms: list<array{section_id: string, item_index: int, form_title: string|null}>}
     */
    public function execute(User $user, ?string $sectionId, ?int $itemIndex): array
    {
        $bio = $this->currentBio->require($user);
        $rows = $this->submissions->allForBio($bio, $sectionId, $itemIndex);

        $formsMap = [];
        foreach ($this->submissions->allForBio($bio) as $row) {
            $key = $row->section_id.':'.$row->item_index;
            if (! isset($formsMap[$key])) {
                $formsMap[$key] = [
                    'section_id' => $row->section_id,
                    'item_index' => $row->item_index,
                    'form_title' => $row->form_title,
                ];
            }
        }

        return [
            'items' => $rows->map(fn ($row) => [
                'id' => $row->id,
                'section_id' => $row->section_id,
                'item_index' => $row->item_index,
                'form_title' => $row->form_title,
                'answers' => $row->answers,
                'created_at' => $row->created_at?->toIso8601String(),
            ])->values()->all(),
            'forms' => array_values($formsMap),
        ];
    }
}
