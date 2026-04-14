<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ToolCall extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'tool_id',
        'called_at',
        'duration_ms',
        'input_params',
        'response_status',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'called_at' => 'datetime',
            'input_params' => 'array',
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
