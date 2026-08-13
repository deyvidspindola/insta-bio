<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Payload do onboarding: slug, pack de cores e JSON inicial da bio.
 */
class CompleteOnboardingRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:40'],
            'theme_pack_id' => ['nullable', 'string', 'max:80'],
            'config' => ['required', 'array'],
        ];
    }

    public function slug(): string
    {
        return $this->string('slug')->toString();
    }

    public function themePackId(): ?string
    {
        $value = $this->input('theme_pack_id');

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * @return array<string, mixed>
     */
    public function config(): array
    {
        $config = $this->input('config', []);

        return is_array($config) ? $config : [];
    }
}
