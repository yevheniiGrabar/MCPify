<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tool_calls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tool_id')->nullable()->constrained('mcp_tools')->nullOnDelete();
            $table->timestamp('called_at')->useCurrent();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->json('input_params')->nullable();
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tool_calls');
    }
};
