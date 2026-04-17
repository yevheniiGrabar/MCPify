<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\McpTool;
use App\Models\Service;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\Yaml\Yaml;

final class OpenApiParser
{
    /**
     * Parse an OpenAPI spec (JSON or YAML as array) and create MCP tools for the service.
     *
     * @return array<McpTool>
     */
    public function parseAndCreateTools(Service $service, array $spec): array
    {
        // Auto-detect custom endpoint list format (non-OpenAPI)
        if ($this->isCustomEndpointFormat($spec)) {
            return $this->parseCustomFormat($service, $spec);
        }

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
     * Detect custom endpoint list format (has "apis" key with nested endpoints).
     */
    private function isCustomEndpointFormat(array $spec): bool
    {
        return isset($spec['apis']) && is_array($spec['apis']) && ! isset($spec['openapi']) && ! isset($spec['swagger']);
    }

    /**
     * Parse custom endpoint list format into MCP tools.
     *
     * Expected structure:
     * {
     *   "apis": {
     *     "surface_name": {
     *       "prefix": "/api",
     *       "endpoints": {
     *         "group_name": [
     *           { "method": "GET", "path": "/api/...", "description": "...", "parameters": {...} }
     *         ]
     *       }
     *     }
     *   }
     * }
     *
     * @return array<McpTool>
     */
    private function parseCustomFormat(Service $service, array $spec): array
    {
        $tools = [];
        $sortOrder = 0;

        foreach ($spec['apis'] as $surface) {
            $endpoints = $surface['endpoints'] ?? [];

            foreach ($endpoints as $groupName => $endpointList) {
                if (! is_array($endpointList)) {
                    continue;
                }

                foreach ($endpointList as $endpoint) {
                    $method = strtoupper($endpoint['method'] ?? '');
                    $path = $endpoint['path'] ?? '';

                    if ($method === '' || $path === '') {
                        continue;
                    }

                    if (! in_array($method, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])) {
                        continue;
                    }

                    $name = $this->generateCustomToolName($endpoint, $method, $path);
                    $description = $endpoint['description'] ?? "{$method} {$path}";
                    $isDestructive = in_array($method, ['DELETE', 'PUT']);

                    $inputSchema = $this->buildCustomInputSchema($endpoint, $path);

                    $tool = $service->tools()->create([
                        'name' => $name,
                        'description' => $description,
                        'http_method' => $method,
                        'endpoint_path' => $path,
                        'input_schema' => $inputSchema,
                        'output_schema' => null,
                        'is_enabled' => ! $isDestructive,
                        'is_destructive' => $isDestructive,
                        'sort_order' => $sortOrder++,
                    ]);

                    $tools[] = $tool;
                }
            }
        }

        return $tools;
    }

    private function generateCustomToolName(array $endpoint, string $method, string $path): string
    {
        // Use controller method if available (e.g. "UserTicketController@get" → "user_ticket_get")
        if (! empty($endpoint['controller'])) {
            $controller = $endpoint['controller'];
            // Extract class@method
            $parts = explode('@', $controller);
            $className = $parts[0] ?? '';
            $methodName = $parts[1] ?? '';

            // Get last segment of namespaced class
            $classSegments = explode('\\', $className);
            $shortClass = end($classSegments);
            // Remove "Controller" suffix
            $shortClass = str_replace('Controller', '', $shortClass);

            $name = Str::snake($shortClass) . '_' . Str::snake($methodName);

            return Str::limit($name, 64, '');
        }

        // Fall back to method + path
        return $this->generateToolName($endpoint, $method, $path);
    }

    private function buildCustomInputSchema(array $endpoint, string $path): array
    {
        $properties = [];
        $required = [];

        // Extract path parameters from URL pattern (e.g. {event_id})
        preg_match_all('/\{(\w+)\}/', $path, $matches);
        foreach ($matches[1] as $paramName) {
            $type = 'string';
            // Use explicit parameter types if provided
            if (isset($endpoint['parameters'][$paramName])) {
                $type = $endpoint['parameters'][$paramName] === 'integer' ? 'integer' : 'string';
            }

            $properties[$paramName] = [
                'type' => $type,
                'description' => "Path parameter: {$paramName}",
                'in' => 'path',
            ];
            $required[] = $paramName;
        }

        return [
            'type' => 'object',
            'properties' => $properties,
            'required' => $required,
        ];
    }

    /**
     * Fetch and parse an OpenAPI spec from a URL.
     *
     * @return array<McpTool>
     */
    public function parseFromUrl(Service $service, string $url): array
    {
        $this->validateUrlForSsrf($url);

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
        // Strip BOM and trim whitespace
        $json = ltrim($json, "\xEF\xBB\xBF");
        $json = trim($json);

        // Try JSON first
        $spec = json_decode($json, true);

        // If JSON fails, try YAML
        if ($spec === null) {
            try {
                $spec = Yaml::parse($json);
            } catch (\Exception) {
                $spec = null;
            }
        }

        if (! is_array($spec)) {
            throw new \RuntimeException('Invalid spec provided. Supports JSON and YAML formats.');
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

    private function validateUrlForSsrf(string $url): void
    {
        $host = parse_url($url, PHP_URL_HOST);

        if (! is_string($host) || $host === '') {
            throw new \InvalidArgumentException('Invalid URL: cannot determine host.');
        }

        // Resolve hostname to IP (returns hostname unchanged on failure)
        $ip = gethostbyname($host);

        if ($ip === $host && filter_var($host, FILTER_VALIDATE_IP) === false) {
            throw new \InvalidArgumentException('Unable to resolve hostname.');
        }

        $flags = FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE;

        if (filter_var($ip, FILTER_VALIDATE_IP, $flags) === false) {
            throw new \InvalidArgumentException('URL resolves to a private or reserved IP address.');
        }
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
