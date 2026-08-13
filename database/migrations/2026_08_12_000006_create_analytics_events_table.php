<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bio_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 16);
            $table->timestamp('occurred_at');
            $table->uuid('visitor_id')->nullable();
            $table->uuid('session_id')->nullable();
            $table->string('path')->nullable();
            $table->string('referrer', 512)->nullable();
            $table->string('section_id', 80)->nullable();
            $table->unsignedSmallInteger('item_index')->nullable();
            $table->string('item_type', 40)->nullable();
            $table->string('label', 160)->nullable();
            $table->string('target_url', 1024)->nullable();
            $table->timestamps();

            $table->index(['bio_id', 'occurred_at']);
            $table->index(['event_type', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
