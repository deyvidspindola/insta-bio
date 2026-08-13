<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Nome do arquivo a ser removido do storage da bio.
 */
class DeleteMediaRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string'],
        ];
    }

    public function fileName(): string
    {
        return $this->string('name')->toString();
    }
}
