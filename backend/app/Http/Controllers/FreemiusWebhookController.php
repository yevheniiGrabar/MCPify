<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\Plan;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Freemius Webhook Controller
 * Handles webhook events from Freemius for subscription/license lifecycle.
 */
class FreemiusWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $secret = config('services.freemius.secret_key');

        if (!$secret) {
            Log::error('Freemius secret key not configured');
            return response()->json(['message' => 'Server configuration error'], 500);
        }

        // Verify webhook signature (required)
        $signature = $request->header('X-Signature');

        if (!$signature) {
            Log::warning('Freemius webhook received without signature');
            return response()->json(['message' => 'Missing signature'], 403);
        }

        $payload = $request->getContent();
        $expectedSignature = hash_hmac('sha256', $payload, $secret);

        if (!hash_equals($expectedSignature, (string) $signature)) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $eventType = $request->input('type');
        $data = $request->input('objects', []);

        Log::info('Freemius webhook received', ['type' => $eventType]);

        match ($eventType) {
            'license.created' => $this->handleLicenseCreated($data),
            'license.cancelled' => $this->handleLicenseCancelled($data),
            'license.expired' => $this->handleLicenseExpired($data),
            'license.plan.changed' => $this->handlePlanChanged($data),
            'license.updated' => $this->handleLicenseUpdated($data),
            'subscription.renewal.failed' => $this->handleRenewalFailed($data),
            default => Log::info('Unhandled Freemius webhook event', ['type' => $eventType]),
        };

        return response()->json(['message' => 'Webhook processed'], 200);
    }

    private function handleLicenseCreated(array $data): void
    {
        $license = $data['license'] ?? [];
        $subscription = $data['subscription'] ?? [];
        $user = $data['user'] ?? [];

        $team = $this->resolveTeam($license, $user);
        if (!$team) {
            return;
        }

        $plan = $this->resolvePlanFromId((string) ($license['plan_id'] ?? ''));

        $team->update([
            'plan' => $plan,
            'fs_subscription_id' => (string) ($subscription['id'] ?? ''),
            'fs_license_id' => (string) ($license['id'] ?? ''),
            'fs_subscription_status' => 'active',
            'fs_current_period_start' => now(),
            'fs_current_period_end' => $license['expiration'] ?? null,
            'fs_cancel_at_period_end' => false,
            'fs_trial_ends_at' => $license['trial_ends'] ?? null,
            'fs_payment_failed_at' => null,
        ]);

        Log::info('Freemius license created', ['team_id' => $team->id, 'plan' => $plan->value]);
    }

    private function handleLicenseCancelled(array $data): void
    {
        $license = $data['license'] ?? [];
        $team = $this->resolveTeamByLicense((string) ($license['id'] ?? ''));
        if (!$team) {
            return;
        }

        $team->update([
            'fs_subscription_status' => 'cancelled',
            'fs_cancel_at_period_end' => true,
        ]);

        Log::info('Freemius license cancelled', ['team_id' => $team->id]);
    }

    private function handleLicenseExpired(array $data): void
    {
        $license = $data['license'] ?? [];
        $team = $this->resolveTeamByLicense((string) ($license['id'] ?? ''));
        if (!$team) {
            return;
        }

        $team->update([
            'plan' => Plan::Free,
            'fs_subscription_status' => 'expired',
            'fs_subscription_id' => null,
            'fs_license_id' => null,
            'fs_cancel_at_period_end' => false,
        ]);

        Log::info('Freemius license expired, downgraded to free', ['team_id' => $team->id]);
    }

    private function handlePlanChanged(array $data): void
    {
        $license = $data['license'] ?? [];
        $team = $this->resolveTeamByLicense((string) ($license['id'] ?? ''));
        if (!$team) {
            return;
        }

        $plan = $this->resolvePlanFromId((string) ($license['plan_id'] ?? ''));

        $team->update([
            'plan' => $plan,
            'fs_current_period_end' => $license['expiration'] ?? $team->fs_current_period_end,
        ]);

        Log::info('Freemius plan changed', ['team_id' => $team->id, 'plan' => $plan->value]);
    }

    private function handleLicenseUpdated(array $data): void
    {
        $license = $data['license'] ?? [];
        $team = $this->resolveTeamByLicense((string) ($license['id'] ?? ''));
        if (!$team) {
            return;
        }

        $team->update([
            'fs_current_period_end' => $license['expiration'] ?? $team->fs_current_period_end,
            'fs_trial_ends_at' => $license['trial_ends'] ?? $team->fs_trial_ends_at,
        ]);
    }

    private function handleRenewalFailed(array $data): void
    {
        $subscription = $data['subscription'] ?? [];
        $team = Team::where('fs_subscription_id', (string) ($subscription['id'] ?? ''))->first();
        if (!$team) {
            return;
        }

        $team->update([
            'fs_subscription_status' => 'past_due',
            'fs_payment_failed_at' => now(),
        ]);

        // Notify team owner about payment failure
        $owner = $team->owner;
        if ($owner) {
            $owner->notify(new \App\Notifications\PaymentFailedNotification($team));
        }

        Log::warning('Freemius renewal failed', ['team_id' => $team->id]);
    }

    /**
     * Resolve team from license custom metadata or user email.
     */
    private function resolveTeam(array $license, array $user): ?Team
    {
        // First try custom metadata (team_id passed during checkout)
        $teamId = $license['metadata']['team_id'] ?? null;
        if ($teamId) {
            return Team::find($teamId);
        }

        // Fallback: find user by email, use their current team
        $email = $user['email'] ?? null;
        if ($email) {
            $appUser = \App\Models\User::where('email', $email)->first();
            return $appUser?->currentTeam;
        }

        Log::warning('Freemius webhook: could not resolve team', ['license' => $license]);
        return null;
    }

    private function resolveTeamByLicense(string $licenseId): ?Team
    {
        if (empty($licenseId)) {
            return null;
        }

        return Team::where('fs_license_id', $licenseId)->first();
    }

    private function resolvePlanFromId(string $planId): Plan
    {
        $map = [
            config('services.freemius.plan_starter') => Plan::Starter,
            config('services.freemius.plan_growth') => Plan::Growth,
            config('services.freemius.plan_business') => Plan::Business,
        ];

        return $map[$planId] ?? Plan::Free;
    }
}
