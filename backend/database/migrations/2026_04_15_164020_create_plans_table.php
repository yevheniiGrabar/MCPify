<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();           // 'free', 'starter', 'growth', 'business'
            $table->string('display_name');             // 'Free', 'Starter', etc.
            $table->unsignedInteger('price');           // monthly price in USD (0 for free)
            $table->unsignedInteger('services_limit')->nullable();     // null = unlimited
            $table->unsignedInteger('calls_per_month'); // monthly tool call quota
            $table->json('features');                   // ["Basic auth", "Community support"]
            $table->string('freemius_plan_id')->nullable(); // Freemius plan ID for checkout
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
