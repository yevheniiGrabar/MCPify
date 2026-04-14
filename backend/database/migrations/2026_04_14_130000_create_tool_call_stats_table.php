<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tool_call_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tool_id')->nullable()->constrained('mcp_tools')->nullOnDelete();
            $table->string('period', 10); // 'hour' or 'day'
            $table->timestamp('period_start');
            $table->unsignedInteger('total_calls')->default(0);
            $table->unsignedInteger('error_calls')->default(0);
            $table->unsignedInteger('avg_duration_ms')->nullable();
            $table->unsignedInteger('p50_duration_ms')->nullable();
            $table->unsignedInteger('p95_duration_ms')->nullable();
            $table->unsignedInteger('p99_duration_ms')->nullable();
            $table->timestamps();

            $table->unique(['service_id', 'tool_id', 'period', 'period_start'], 'tool_call_stats_unique');
            $table->index(['service_id', 'period', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tool_call_stats');
    }
};
