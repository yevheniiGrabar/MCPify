<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->string('plan')->default('free')->after('slug');
            $table->string('fs_subscription_id')->nullable()->after('plan');
            $table->string('fs_license_id')->nullable()->after('fs_subscription_id');
            $table->string('fs_subscription_status')->nullable()->after('fs_license_id');
            $table->timestamp('fs_current_period_start')->nullable()->after('fs_subscription_status');
            $table->timestamp('fs_current_period_end')->nullable()->after('fs_current_period_start');
            $table->boolean('fs_cancel_at_period_end')->default(false)->after('fs_current_period_end');
            $table->timestamp('fs_trial_ends_at')->nullable()->after('fs_cancel_at_period_end');
            $table->timestamp('fs_payment_failed_at')->nullable()->after('fs_trial_ends_at');

            $table->index('fs_subscription_id');
            $table->index('fs_license_id');
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropIndex(['fs_subscription_id']);
            $table->dropIndex(['fs_license_id']);
            $table->dropColumn([
                'plan',
                'fs_subscription_id',
                'fs_license_id',
                'fs_subscription_status',
                'fs_current_period_start',
                'fs_current_period_end',
                'fs_cancel_at_period_end',
                'fs_trial_ends_at',
                'fs_payment_failed_at',
            ]);
        });
    }
};
