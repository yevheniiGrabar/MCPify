<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ToolCallStat extends Model
{
    protected $fillable = [
        'service_id',
        'tool_id',
        'period',
        'period_start',
        'total_calls',
        'error_calls',
        'avg_duration_ms',
        'p50_duration_ms',
        'p95_duration_ms',
        'p99_duration_ms',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'datetime',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function tool(): BelongsTo
    {
        return $this->belongsTo(McpTool::class, 'tool_id');
    }
}
