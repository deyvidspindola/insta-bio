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
            'section_id' => ['nullable', 'string', 'max:120'],
            'item_index' => ['nullable', 'integer', 'min:0'],
            'form_slug' => ['nullable', 'string', 'max:40'],
            'answers' => ['required', 'array'],
            'answers.*' => ['nullable', 'string', 'max:5000'],
            'form_title' => ['nullable', 'string', 'max:200'],
            'visitor_id' => ['nullable', 'string', 'max:64'],
            /** Honeypot: se preenchido, o UseCase ignora o envio. */
            'website' => ['nullable', 'string', 'max:200'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $slug = $this->input('form_slug');
            $section = $this->input('section_id');
            $hasSlug = is_string($slug) && trim($slug) !== '';
            $hasSection = is_string($section) && trim($section) !== '';
            if (! $hasSlug && ! $hasSection) {
                $validator->errors()->add('form_slug', 'Informe form_slug ou section_id.');
            }
        });
    }
}
