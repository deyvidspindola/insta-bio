<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Criação de formulário: título obrigatório, slug opcional.
 */
class CreateBioFormRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:40'],
        ];
    }

    public function title(): string
    {
        return $this->string('title')->toString();
    }

    public function slug(): ?string
    {
        $value = $this->input('slug');

        return is_string($value) && trim($value) !== '' ? $value : null;
    }
}
