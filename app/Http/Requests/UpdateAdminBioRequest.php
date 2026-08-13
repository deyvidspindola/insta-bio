<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Alteração administrativa de plano ou status.
 */
class UpdateAdminBioRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'in:active,suspended'],
            'plan' => ['sometimes', 'in:free,pro'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function attributesToUpdate(): array
    {
        return $this->validated();
    }
}
