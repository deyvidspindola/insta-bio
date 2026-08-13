<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Dados de cadastro por e-mail e senha.
 */
class RegisterRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }

    public function name(): string
    {
        return $this->string('name')->toString();
    }

    public function email(): string
    {
        return $this->string('email')->toString();
    }

    public function password(): string
    {
        return $this->string('password')->toString();
    }
}
