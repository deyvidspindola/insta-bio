<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Envio público de resposta de formulário da bio.
 */
class SubmitFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'analytics_key' => ['required', 'string', 'max:64'],
            'section_id' => ['required', 'string', 'max:120'],
            'item_index' => ['required', 'integer', 'min:0'],
            'answers' => ['required', 'array'],
            'answers.*' => ['nullable', 'string', 'max:5000'],
            'form_title' => ['nullable', 'string', 'max:200'],
            'visitor_id' => ['nullable', 'string', 'max:64'],
            /** Honeypot: se preenchido, o UseCase ignora o envio. */
            'website' => ['nullable', 'string', 'max:200'],
        ];
    }
}
