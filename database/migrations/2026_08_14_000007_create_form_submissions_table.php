<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Respostas enviadas pelos blocos de formulário da bio pública.
     */
    public function up(): void
    {
        Schema::create('form_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bio_id')->constrained()->cascadeOnDelete();
            $table->string('section_id');
            $table->unsignedInteger('item_index');
            $table->string('form_title')->nullable();
            $table->json('answers');
            $table->string('visitor_id')->nullable();
            $table->string('ip')->nullable();
            $table->timestamps();

            $table->index(['bio_id', 'created_at']);
            $table->index(['bio_id', 'section_id', 'item_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
    }
};
