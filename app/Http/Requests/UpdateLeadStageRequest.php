<?php

namespace App\Http\Requests;

use App\Models\Lead;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Atualização do estágio de um lead do funil.
 */
class UpdateLeadStageRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'stage' => ['required', 'string', Rule::in(Lead::STAGES)],
        ];
    }

    public function stage(): string
    {
        return $this->string('stage')->toString();
    }
}
