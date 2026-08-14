<?php

namespace App\UseCases\BioForm;

use App\Models\BioForm;

/**
 * Serialização padrão de BioForm para a API.
 */
trait SerializesBioForm
{
    /**
     * @return array<string, mixed>
     */
    private function toArray(BioForm $form): array
    {
        return [
            'id' => $form->id,
            'slug' => $form->slug,
            'title' => $form->title,
            'status' => $form->status,
            'json_draft' => $form->json_draft,
            'json_published' => $form->json_published,
            'created_at' => $form->created_at?->toIso8601String(),
            'updated_at' => $form->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Definição inicial do rascunho.
     *
     * @return array<string, mixed>
     */
    private function defaultDraft(): array
    {
        return [
            'description' => '',
            'fields' => [
                [
                    'id' => 'nome',
                    'type' => 'text',
                    'label' => 'Nome',
                    'required' => true,
                    'placeholder' => 'Seu nome',
                ],
                [
                    'id' => 'email',
                    'type' => 'email',
                    'label' => 'E-mail',
                    'required' => true,
                    'placeholder' => 'voce@email.com',
                ],
                [
                    'id' => 'mensagem',
                    'type' => 'textarea',
                    'label' => 'Mensagem',
                    'required' => false,
                    'placeholder' => 'Como podemos ajudar?',
                ],
            ],
            'submitLabel' => 'Enviar',
            'successMessage' => 'Recebemos sua mensagem. Obrigado!',
        ];
    }
}
