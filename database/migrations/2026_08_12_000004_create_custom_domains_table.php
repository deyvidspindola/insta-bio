<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_domains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bio_id')->constrained()->cascadeOnDelete();
            $table->string('domain')->unique();
            $table->string('verification_token', 64);
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_domains');
    }
};
