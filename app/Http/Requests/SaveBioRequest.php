<?php

namespace App\Http\Requests;

use App\Services\BioConfigParser;
use Illuminate\Foundation\Http\FormRequest;

/**
 * JSON da bio enviado pelo editor (save/publish).
 */
class SaveBioRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }

    /**
     * @return array<string, mixed>
     */
    public function config(BioConfigParser $parser): array
    {
        return $parser->parse($this->input('config', $this->all()));
    }
}
