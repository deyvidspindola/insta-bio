<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Páginas internas da bio (um nível, mesmo schema de sections).
     */
    public function up(): void
    {
        Schema::create('bio_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bio_id')->constrained()->cascadeOnDelete();
            $table->string('slug');
            $table->string('title');
            $table->json('json_draft')->nullable();
            $table->json('json_published')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->unique(['bio_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bio_pages');
    }
};
