<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class McpToolResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_id' => $this->service_id,
            'name' => $this->name,
            'description' => $this->description,
            'http_method' => $this->http_method,
            'endpoint_path' => $this->endpoint_path,
            'input_schema' => $this->input_schema,
            'output_schema' => $this->output_schema,
            'is_enabled' => $this->is_enabled,
            'is_destructive' => $this->is_destructive,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
