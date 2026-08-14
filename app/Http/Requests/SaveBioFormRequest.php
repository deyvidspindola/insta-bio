<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Rascunho do formulário: config/fields (+ title opcional).
 */
class SaveBioFormRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:120'],
            'config' => ['nullable', 'array'],
            'fields' => ['nullable', 'array'],
            'description' => ['nullable', 'string', 'max:500'],
            'submitLabel' => ['nullable', 'string', 'max:80'],
            'successMessage' => ['nullable', 'string', 'max:200'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $config = $this->input('config');
            $fields = $this->input('fields');
            if (! is_array($config) && ! is_array($fields)) {
                $validator->errors()->add('fields', 'Informe config ou fields.');
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function draftPayload(): array
    {
        $payload = $this->validated();
        if (isset($payload['config']) && is_array($payload['config'])) {
            return $payload;
        }

        return [
            'title' => $payload['title'] ?? null,
            'description' => $payload['description'] ?? '',
            'fields' => $payload['fields'] ?? [],
            'submitLabel' => $payload['submitLabel'] ?? 'Enviar',
            'successMessage' => $payload['successMessage'] ?? 'Recebemos sua mensagem. Obrigado!',
        ];
    }
}
