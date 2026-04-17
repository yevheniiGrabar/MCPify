<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registry_servers', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('org_id')->nullable()->index();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('category');
            $table->string('endpoint_url');
            $table->string('auth_type')->default('api_key');
            $table->jsonb('schema_json')->nullable();
            $table->string('version')->default('1.0.0');
            $table->boolean('is_public')->default(true);
            $table->boolean('is_verified')->default(false);
            $table->integer('install_count')->default(0);
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->string('pricing_type')->default('free');
            $table->integer('price_monthly')->nullable();
            $table->text('logo_url')->nullable();
            $table->jsonb('tags')->nullable();
            $table->string('github_url')->nullable();
            $table->string('docs_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registry_servers');
    }
};
