<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateLeadStageRequest;
use App\UseCases\Leads\DeleteLead;
use App\UseCases\Leads\ListLeads;
use App\UseCases\Leads\UpdateLeadNotes;
use App\UseCases\Leads\UpdateLeadStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * API do funil de prospects (leads).
 */
class LeadController extends Controller
{
    /**
     * Lista leads da bio do usuário.
     */
    public function index(Request $request, ListLeads $useCase): JsonResponse
    {
        return response()->json($useCase->execute($this->actor($request)));
    }

    /**
     * Atualiza o estágio do lead.
     */
    public function updateStage(UpdateLeadStageRequest $request, int $id, UpdateLeadStage $useCase): JsonResponse
    {
        return response()->json(
            $useCase->execute($this->actor($request), $id, $request->stage())
        );
    }

    /**
     * Atualiza as anotações do lead.
     */
    public function updateNotes(Request $request, int $id, UpdateLeadNotes $useCase): JsonResponse
    {
        $notes = $request->input('notes');
        $normalized = is_string($notes) ? $notes : (is_null($notes) ? null : (string) $notes);

        return response()->json(
            $useCase->execute($this->actor($request), $id, $normalized)
        );
    }

    /**
     * Remove o lead.
     */
    public function destroy(Request $request, int $id, DeleteLead $useCase): JsonResponse
    {
        $useCase->execute($this->actor($request), $id);

        return response()->json(['ok' => true]);
    }
}
