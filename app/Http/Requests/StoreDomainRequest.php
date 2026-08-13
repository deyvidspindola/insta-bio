<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Hostname informado na tela de domínio próprio.
 */
class StoreDomainRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'domain' => ['required', 'string', 'max:255'],
        ];
    }

    public function domain(): string
    {
        return $this->string('domain')->toString();
    }
}
