<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('type')->default('manual');
            $table->string('base_url')->nullable();
            $table->string('auth_type')->nullable();
            $table->text('auth_config')->nullable();
            $table->text('openapi_spec_url')->nullable();
            $table->longText('openapi_spec_json')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_configs');
    }
};
