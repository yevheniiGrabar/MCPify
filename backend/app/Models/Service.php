<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ServiceStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Service extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'team_id',
        'name',
        'description',
        'status',
        'mcp_url_token',
    ];

    protected function casts(): array
    {
        return [
            'status' => ServiceStatus::class,
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Service $service): void {
            if (empty($service->uuid)) {
                $service->uuid = (string) Str::uuid();
            }
            if (empty($service->mcp_url_token)) {
                $service->mcp_url_token = Str::random(64);
            }
        });
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function apiConfig(): HasOne
    {
        return $this->hasOne(ApiConfig::class);
    }

    public function tools(): HasMany
    {
        return $this->hasMany(McpTool::class);
    }

    public function toolCalls(): HasMany
    {
        return $this->hasMany(ToolCall::class);
    }
}
