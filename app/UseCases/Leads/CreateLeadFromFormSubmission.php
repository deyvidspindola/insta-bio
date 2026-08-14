<?php

namespace App\UseCases\Leads;

use App\Models\FormSubmission;
use App\Models\Lead;
use App\Repositories\LeadRepository;

/**
 * Cria um lead a partir de uma resposta de formulário.
 */
final class CreateLeadFromFormSubmission
{
    public function __construct(
        private LeadRepository $leads,
    ) {}

    public function execute(FormSubmission $submission): Lead
    {
        [$name, $contact] = $this->extractNameAndContact($submission);

        return $this->leads->create([
            'bio_id' => $submission->bio_id,
            'name' => $name,
            'contact' => $contact,
            'source_type' => 'form',
            'source_label' => $submission->form_title,
            'stage' => 'novo',
            'visitor_id' => $submission->visitor_id,
        ]);
    }

    /**
     * Heurística: type email/phone ou label com nome/e-mail/telefone.
     *
     * @return array{0: string|null, 1: string|null}
     */
    private function extractNameAndContact(FormSubmission $submission): array
    {
        $answers = is_array($submission->answers) ? $submission->answers : [];
        $fields = $this->resolveFormFields($submission);

        $name = null;
        $email = null;
        $phone = null;

        foreach ($fields as $field) {
            if (! is_array($field)) {
                continue;
            }

            $id = isset($field['id']) && is_string($field['id']) ? $field['id'] : null;
            if ($id === null || ! array_key_exists($id, $answers)) {
                continue;
            }

            $value = is_scalar($answers[$id]) ? trim((string) $answers[$id]) : '';
            if ($value === '') {
                continue;
            }

            $type = isset($field['type']) && is_string($field['type'])
                ? strtolower($field['type'])
                : '';
            $label = isset($field['label']) && is_string($field['label'])
                ? mb_strtolower($field['label'])
                : '';

            if ($name === null && ($type === 'text' || $type === '') && $this->labelLooksLikeName($label)) {
                $name = $value;
            }

            if ($email === null && ($type === 'email' || $this->labelLooksLikeEmail($label))) {
                $email = $value;
            }

            if ($phone === null && ($type === 'phone' || $this->labelLooksLikePhone($label))) {
                $phone = $value;
            }
        }

        // Fallback sem metadados do card: inspeciona valores/chaves das respostas.
        if ($name === null && $email === null && $phone === null) {
            foreach ($answers as $key => $raw) {
                $value = is_scalar($raw) ? trim((string) $raw) : '';
                if ($value === '') {
                    continue;
                }
                $haystack = mb_strtolower(is_string($key) ? $key : '');

                if ($email === null && (str_contains($haystack, 'mail') || filter_var($value, FILTER_VALIDATE_EMAIL))) {
                    $email = $value;
                } elseif ($phone === null && (str_contains($haystack, 'tel') || str_contains($haystack, 'fone') || $this->looksLikePhone($value))) {
                    $phone = $value;
                } elseif ($name === null && $this->labelLooksLikeName($haystack)) {
                    $name = $value;
                }
            }
        }

        $contact = $email ?? $phone;

        return [
            $name !== null && $name !== '' ? $name : null,
            $contact !== null && $contact !== '' ? $contact : null,
        ];
    }

    /**
     * Campos do bloco de formulário no JSON da bio (publicado ou rascunho).
     *
     * @return list<array<string, mixed>>
     */
    private function resolveFormFields(FormSubmission $submission): array
    {
        $bio = $submission->bio;
        if ($bio === null) {
            return [];
        }

        $config = $bio->json_published ?? $bio->json_draft ?? [];
        $sections = is_array($config['sections'] ?? null) ? $config['sections'] : [];

        foreach ($sections as $section) {
            if (! is_array($section)) {
                continue;
            }
            $sectionId = isset($section['id']) ? (string) $section['id'] : '';
            if ($sectionId !== $submission->section_id) {
                continue;
            }

            $items = is_array($section['items'] ?? null) ? $section['items'] : [];
            $item = $items[$submission->item_index] ?? null;
            if (! is_array($item) || ($item['type'] ?? null) !== 'form') {
                return [];
            }

            $fields = $item['fields'] ?? [];

            return is_array($fields) ? array_values(array_filter($fields, 'is_array')) : [];
        }

        return [];
    }

    private function labelLooksLikeName(string $label): bool
    {
        return str_contains($label, 'nome') || str_contains($label, 'name');
    }

    private function labelLooksLikeEmail(string $label): bool
    {
        return str_contains($label, 'e-mail')
            || str_contains($label, 'email')
            || str_contains($label, 'mail');
    }

    private function labelLooksLikePhone(string $label): bool
    {
        return str_contains($label, 'telefone')
            || str_contains($label, 'whatsapp')
            || str_contains($label, 'celular')
            || str_contains($label, 'fone')
            || str_contains($label, 'phone')
            || str_contains($label, 'tel');
    }

    private function looksLikePhone(string $value): bool
    {
        $digits = preg_replace('/\D+/', '', $value) ?? '';

        return strlen($digits) >= 8 && strlen($digits) <= 15;
    }
}
