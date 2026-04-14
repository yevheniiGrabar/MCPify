<?php

declare(strict_types=1);

namespace App\Actions\Services;

use App\Models\McpTool;
use App\Models\Service;
use Illuminate\Support\Facades\DB;

final class ConnectManualAction
{
    public function execute(
        Service $service,
        string $name,
        string $httpMethod,
        string $endpointPath,
        ?string $description = null,
        ?array $inputSchema = null,
        ?string $baseUrl = null,
        ?string $authType = null,
        mixed $authConfig = null,
    ): McpTool {
        return DB::transaction(function () use (
            $service, $name, $httpMethod, $endpointPath,
            $description, $inputSchema, $baseUrl, $authType, $authConfig,
        ): McpTool {
            // Update api_config if base_url or auth provided
            if ($baseUrl || $authType) {
                $apiConfig = $service->apiConfig;
                if ($apiConfig) {
                    $updates = ['type' => 'manual'];
                    if ($baseUrl) {
                        $updates['base_url'] = $baseUrl;
                    }
                    if ($authType) {
                        $updates['auth_type'] = $authType;
                    }
                    if ($authConfig !== null) {
                        $updates['auth_config'] = $authConfig;
                    }
                    $apiConfig->update($updates);
                }
            }

            $isDestructive = in_array(strtoupper($httpMethod), ['DELETE', 'PUT']);
            $maxSort = $service->tools()->max('sort_order') ?? -1;

            return $service->tools()->create([
                'name' => $name,
                'description' => $description,
                'http_method' => strtoupper($httpMethod),
                'endpoint_path' => $endpointPath,
                'input_schema' => $inputSchema,
                'is_enabled' => ! $isDestructive,
                'is_destructive' => $isDestructive,
                'sort_order' => $maxSort + 1,
            ]);
        });
    }
}
