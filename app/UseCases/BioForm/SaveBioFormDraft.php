<?php

namespace App\UseCases\BioForm;

use App\Exceptions\ApplicationException;
use App\Models\User;
use App\Repositories\BioFormRepository;
use App\Services\CurrentBioService;

/**
 * Persiste o rascunho (campos) de um formulário.
 */
final class SaveBioFormDraft
{
    use SerializesBioForm;

    public function __construct(
        private CurrentBioService $currentBio,
        private BioFormRepository $forms,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function execute(User $user, string $slug, array $payload): array
    {
        $bio = $this->currentBio->require($user);
        $form = $this->forms->findBySlug($bio, $slug);
        if ($form === null) {
            throw new ApplicationException('Formulário não encontrado.', 404);
        }

        $draft = $this->normalizeDraft($payload);
        if (isset($payload['title']) && is_string($payload['title']) && trim($payload['title']) !== '') {
            $form = $this->forms->update($form, [
                'title' => trim($payload['title']),
                'json_draft' => $draft,
            ]);
        } else {
            $form = $this->forms->update($form, [
                'json_draft' => $draft,
            ]);
        }

        return $this->toArray($form);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function normalizeDraft(array $payload): array
    {
        $source = $payload;
        if (isset($payload['config']) && is_array($payload['config'])) {
            $source = $payload['config'];
        }

        $fields = $source['fields'] ?? null;
        if (! is_array($fields)) {
            throw new ApplicationException('JSON do formulário inválido: fields obrigatório.', 422);
        }

        $normalizedFields = [];
        foreach (array_values($fields) as $field) {
            if (! is_array($field)) {
                continue;
            }
            $id = isset($field['id']) && is_string($field['id']) ? trim($field['id']) : '';
            $label = isset($field['label']) && is_string($field['label']) ? trim($field['label']) : '';
            if ($id === '' || $label === '') {
                continue;
            }
            $type = isset($field['type']) && is_string($field['type']) ? $field['type'] : 'text';
            if (! in_array($type, ['text', 'email', 'phone', 'textarea'], true)) {
                $type = 'text';
            }
            $normalizedFields[] = [
                'id' => $id,
                'type' => $type,
                'label' => $label,
                'required' => (bool) ($field['required'] ?? false),
                'placeholder' => isset($field['placeholder']) && is_string($field['placeholder'])
                    ? $field['placeholder']
                    : '',
            ];
        }

        return [
            'description' => isset($source['description']) && is_string($source['description'])
                ? $source['description']
                : '',
            'fields' => $normalizedFields,
            'submitLabel' => isset($source['submitLabel']) && is_string($source['submitLabel'])
                ? $source['submitLabel']
                : 'Enviar',
            'successMessage' => isset($source['successMessage']) && is_string($source['successMessage'])
                ? $source['successMessage']
                : 'Recebemos sua mensagem. Obrigado!',
        ];
    }
}
