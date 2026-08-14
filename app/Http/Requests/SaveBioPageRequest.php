<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Rascunho da página interna: `config` ou `sections`.
 */
class SaveBioPageRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'config' => ['nullable', 'array'],
            'sections' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $config = $this->input('config');
            $sections = $this->input('sections');

            $hasConfig = is_array($config);
            $hasSections = is_array($sections);

            if (! $hasConfig && ! $hasSections) {
                $validator->errors()->add('sections', 'Informe config ou sections.');
            }
        });
    }

    /**
     * Payload normalizado para o use case (lista ou envelope com sections).
     *
     * @return list<mixed>|array{sections: list<mixed>}
     */
    public function draftPayload(): array
    {
        $config = $this->input('config');
        if (is_array($config)) {
            if (isset($config['sections']) && is_array($config['sections'])) {
                return ['sections' => array_values($config['sections'])];
            }

            if (array_is_list($config)) {
                return $config;
            }
        }

        $sections = $this->input('sections');
        if (is_array($sections)) {
            return array_is_list($sections)
                ? $sections
                : ['sections' => array_values($sections)];
        }

        return ['sections' => []];
    }
}
