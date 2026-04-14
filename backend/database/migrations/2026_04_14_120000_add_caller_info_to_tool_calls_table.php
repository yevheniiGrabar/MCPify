<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tool_calls', function (Blueprint $table) {
            $table->string('caller_ip', 45)->nullable()->after('error_message');
            $table->string('caller_user_agent', 500)->nullable()->after('caller_ip');
        });
    }

    public function down(): void
    {
        Schema::table('tool_calls', function (Blueprint $table) {
            $table->dropColumn(['caller_ip', 'caller_user_agent']);
        });
    }
};
