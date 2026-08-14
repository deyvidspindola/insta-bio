<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Leads do funil (formulários e cliques em WhatsApp hero).
     */
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bio_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('contact')->nullable();
            $table->string('source_type');
            $table->string('source_label')->nullable();
            $table->string('stage')->default('novo');
            $table->text('notes')->nullable();
            $table->string('visitor_id')->nullable();
            $table->timestamps();

            $table->index(['bio_id', 'created_at']);
            $table->index(['bio_id', 'source_type', 'visitor_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
