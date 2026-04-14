<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class McpTool extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'name',
        'description',
        'http_method',
        'endpoint_path',
        'input_schema',
        'output_schema',
        'is_enabled',
        'is_destructive',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'input_schema' => 'array',
            'output_schema' => 'array',
            'is_enabled' => 'boolean',
            'is_destructive' => 'boolean',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function toolCalls(): HasMany
    {
        return $this->hasMany(ToolCall::class, 'tool_id');
    }
}
