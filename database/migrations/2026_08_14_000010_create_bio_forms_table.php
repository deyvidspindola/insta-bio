<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Formulários reutilizáveis da bio (definição separada do JSON da bio).
     */
    public function up(): void
    {
        Schema::create('bio_forms', function (Blueprint $table) {
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

        Schema::table('form_submissions', function (Blueprint $table) {
            $table->string('form_slug')->nullable()->after('item_index');
            $table->index(['bio_id', 'form_slug']);
        });
    }

    public function down(): void
    {
        Schema::table('form_submissions', function (Blueprint $table) {
            $table->dropIndex(['bio_id', 'form_slug']);
            $table->dropColumn('form_slug');
        });

        Schema::dropIfExists('bio_forms');
    }
};
