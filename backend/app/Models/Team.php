<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Plan;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Team extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'plan',
        'fs_subscription_id',
        'fs_license_id',
        'fs_subscription_status',
        'fs_current_period_start',
        'fs_current_period_end',
        'fs_cancel_at_period_end',
        'fs_trial_ends_at',
        'fs_payment_failed_at',
    ];

    protected function casts(): array
    {
        return [
            'plan' => Plan::class,
            'fs_current_period_start' => 'datetime',
            'fs_current_period_end' => 'datetime',
            'fs_cancel_at_period_end' => 'boolean',
            'fs_trial_ends_at' => 'datetime',
            'fs_payment_failed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Team $team): void {
            if (empty($team->uuid)) {
                $team->uuid = (string) Str::uuid();
            }
            if (empty($team->slug)) {
                $team->slug = Str::slug($team->name) . '-' . Str::random(6);
            }
        });
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function getOwnerAttribute(): ?User
    {
        return $this->users()->wherePivot('role', 'owner')->first();
    }
}
