<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\McpTool;
use App\Models\Service;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

final class OpenApiParser
{
    /**
     * Parse an OpenAPI spec (JSON or YAML as array) and create MCP tools for the service.
     *
     * @return array<McpTool>
     */
    public function parseAndCreateTools(Service $service, array $spec): array
    {
        $paths = $spec['paths'] ?? [];
        $tools = [];
        $sortOrder = 0;

        foreach ($paths as $path => $methods) {
            foreach ($methods as $method => $operation) {
                $method = strtoupper($method);

                if (! in_array($method, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])) {
                    continue;
                }

                $name = $this->generateToolName($operation, $method, $path);
                $description = $this->generateDescription($operation, $method, $path);
                $inputSchema = $this->buildInputSchema($operation, $spec);
                $isDestructive = in_array($method, ['DELETE', 'PUT']);

                $tool = $service->tools()->create([
                    'name' => $name,
                    'description' => $description,
                    'http_method' => $method,
                    'endpoint_path' => $path,
                    'input_schema' => $inputSchema,
                    'output_schema' => $this->buildOutputSchema($operation, $spec),
                    'is_enabled' => ! $isDestructive,
                    'is_destructive' => $isDestructive,
                    'sort_order' => $sortOrder++,
                ]);

                $tools[] = $tool;
            }
        }

        return $tools;
    }

    /**
     * Fetch and parse an OpenAPI spec from a URL.
     *
     * @return array<McpTool>
     */
    public function parseFromUrl(Service $service, string $url): array
    {
        $response = Http::timeout(30)->get($url);

        if (! $response->successful()) {
            throw new \RuntimeException("Failed to fetch OpenAPI spec from {$url}: {$response->status()}");
        }

        $contentType = $response->header('Content-Type', '');
        $body = $response->body();

        $spec = $this->decodeSpec($body, $contentType);

        // Store the spec on the api_config
        $apiConfig = $service->apiConfig;
        if ($apiConfig) {
            $apiConfig->update([
                'openapi_spec_url' => $url,
                'openapi_spec_json' => json_encode($spec),
                'type' => 'openapi',
                'base_url' => $this->extractBaseUrl($spec, $url),
            ]);
        }

        return $this->parseAndCreateTools($service, $spec);
    }

    /**
     * Parse an OpenAPI spec from a JSON string.
     *
     * @return array<McpTool>
     */
    public function parseFromJson(Service $service, string $json): array
    {
        $spec = json_decode($json, true);

        if ($spec === null) {
            throw new \RuntimeException('Invalid JSON provided for OpenAPI spec');
        }

        $apiConfig = $service->apiConfig;
        if ($apiConfig) {
            $apiConfig->update([
                'openapi_spec_json' => $json,
                'type' => 'openapi',
                'base_url' => $this->extractBaseUrl($spec, null),
            ]);
        }

        return $this->parseAndCreateTools($service, $spec);
    }

    private function decodeSpec(string $body, string $contentType): array
    {
        // Try JSON first
        $decoded = json_decode($body, true);
        if ($decoded !== null) {
            return $decoded;
        }

        // Try YAML if json_decode failed
        if (function_exists('yaml_parse')) {
            $decoded = yaml_parse($body);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        throw new \RuntimeException('Failed to parse OpenAPI spec. Provide valid JSON.');
    }

    private function generateToolName(array $operation, string $method, string $path): string
    {
        if (! empty($operation['operationId'])) {
            return Str::snake($operation['operationId']);
        }

        $pathParts = array_filter(explode('/', $path));
        $cleanParts = array_map(fn (string $part): string => str_replace(['{', '}'], '', $part), $pathParts);

        $prefix = match ($method) {
            'GET' => 'get',
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => strtolower($method),
        };

        return $prefix . '_' . implode('_', $cleanParts);
    }

    private function generateDescription(array $operation, string $method, string $path): string
    {
        if (! empty($operation['summary'])) {
            return $operation['summary'];
        }

        if (! empty($operation['description'])) {
            return Str::limit($operation['description'], 500);
        }

        return "{$method} {$path}";
    }

    private function buildInputSchema(array $operation, array $spec): array
    {
        $properties = [];
        $required = [];

        // Path parameters
        foreach ($operation['parameters'] ?? [] as $param) {
            $param = $this->resolveRef($param, $spec);
            $name = $param['name'] ?? '';
            if ($name === '') {
                continue;
            }

            $properties[$name] = [
                'type' => $param['schema']['type'] ?? 'string',
                'description' => $param['description'] ?? "Parameter: {$name}",
                'in' => $param['in'] ?? 'query',
            ];

            if (! empty($param['required'])) {
                $required[] = $name;
            }
        }

        // Request body
        if (! empty($operation['requestBody'])) {
            $requestBody = $this->resolveRef($operation['requestBody'], $spec);
            $content = $requestBody['content'] ?? [];
            $jsonSchema = $content['application/json']['schema'] ?? null;

            if ($jsonSchema) {
                $resolved = $this->resolveRef($jsonSchema, $spec);
                $bodyProps = $resolved['properties'] ?? [];
                $bodyRequired = $resolved['required'] ?? [];

                foreach ($bodyProps as $name => $propSchema) {
                    $propSchema = $this->resolveRef($propSchema, $spec);
                    $properties[$name] = [
                        'type' => $propSchema['type'] ?? 'string',
                        'description' => $propSchema['description'] ?? "Body field: {$name}",
                        'in' => 'body',
                    ];
                }

                $required = array_merge($required, $bodyRequired);
            }
        }

        return [
            'type' => 'object',
            'properties' => $properties,
            'required' => array_values(array_unique($required)),
        ];
    }

    private function buildOutputSchema(array $operation, array $spec): ?array
    {
        $responses = $operation['responses'] ?? [];
        $successResponse = $responses['200'] ?? $responses['201'] ?? $responses['2xx'] ?? null;

        if (! $successResponse) {
            return null;
        }

        $successResponse = $this->resolveRef($successResponse, $spec);
        $content = $successResponse['content'] ?? [];
        $jsonSchema = $content['application/json']['schema'] ?? null;

        if (! $jsonSchema) {
            return null;
        }

        return $this->resolveRef($jsonSchema, $spec);
    }

    private function resolveRef(array $schema, array $spec): array
    {
        if (! isset($schema['$ref'])) {
            return $schema;
        }

        $ref = $schema['$ref'];
        $parts = explode('/', ltrim($ref, '#/'));

        $resolved = $spec;
        foreach ($parts as $part) {
            $resolved = $resolved[$part] ?? [];
        }

        return is_array($resolved) ? $resolved : [];
    }

    private function extractBaseUrl(array $spec, ?string $specUrl): ?string
    {
        // OpenAPI 3.x
        if (! empty($spec['servers'][0]['url'])) {
            $serverUrl = $spec['servers'][0]['url'];
            if (str_starts_with($serverUrl, 'http')) {
                return rtrim($serverUrl, '/');
            }
            // Relative URL — resolve against spec URL
            if ($specUrl) {
                $parsed = parse_url($specUrl);
                $base = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
                return rtrim($base . '/' . ltrim($serverUrl, '/'), '/');
            }
        }

        // Swagger 2.0
        if (! empty($spec['host'])) {
            $scheme = $spec['schemes'][0] ?? 'https';
            $basePath = $spec['basePath'] ?? '';
            return rtrim("{$scheme}://{$spec['host']}{$basePath}", '/');
        }

        return null;
    }
}
