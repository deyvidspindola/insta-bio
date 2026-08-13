<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('slug', 40)->unique();
            $table->string('plan', 16)->default('free');
            $table->string('status', 16)->default('active');
            $table->string('theme_pack_id')->nullable();
            $table->json('json_draft')->nullable();
            $table->json('json_published')->nullable();
            $table->json('json_backup')->nullable();
            $table->uuid('analytics_key')->unique();
            $table->timestamps();

            $table->index('status');
            $table->index('plan');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bios');
    }
};
