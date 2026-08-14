<?php

namespace App\UseCases\Forms;

use App\Models\Bio;
use App\Models\FormSubmission;
use App\Repositories\BioRepository;
use App\Repositories\FormSubmissionRepository;
use App\UseCases\Leads\CreateLeadFromFormSubmission;

/**
 * Persiste a resposta de um bloco de formulário da bio pública.
 */
final class SubmitFormResponse
{
    public function __construct(
        private BioRepository $bios,
        private FormSubmissionRepository $submissions,
        private CreateLeadFromFormSubmission $createLead,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function execute(array $payload, ?string $ip): ?FormSubmission
    {
        if (filled($payload['website'] ?? null)) {
            return null;
        }

        $key = $payload['analytics_key'] ?? null;
        $bio = is_string($key) && $key !== ''
            ? $this->bios->findByAnalyticsKey($key)
            : null;

        if (! $bio instanceof Bio || ! $bio->isActive()) {
            return null;
        }

        $answers = is_array($payload['answers'] ?? null) ? $payload['answers'] : [];
        $normalized = [];
        foreach ($answers as $fieldId => $value) {
            if (! is_string($fieldId)) {
                continue;
            }
            $normalized[$fieldId] = is_scalar($value) ? (string) $value : '';
        }

        $submission = $this->submissions->create([
            'bio_id' => $bio->id,
            'section_id' => (string) ($payload['section_id'] ?? ''),
            'item_index' => (int) ($payload['item_index'] ?? 0),
            'form_title' => isset($payload['form_title']) ? (string) $payload['form_title'] : null,
            'answers' => $normalized,
            'visitor_id' => isset($payload['visitor_id']) ? (string) $payload['visitor_id'] : null,
            'ip' => $ip,
        ]);

        // Garante relação bio para extrair campos do formulário no lead.
        $submission->setRelation('bio', $bio);
        $this->createLead->execute($submission);

        return $submission;
    }
}
