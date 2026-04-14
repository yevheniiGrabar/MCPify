<?php

declare(strict_types=1);

namespace App\Actions\Services;

use App\Models\Service;
use App\Services\OpenApiParser;
use Illuminate\Support\Facades\DB;

final class ConnectOpenApiAction
{
    public function __construct(
        private readonly OpenApiParser $parser,
    ) {}

    /**
     * @return array<\App\Models\McpTool>
     */
    public function execute(Service $service, ?string $url = null, ?string $specJson = null): array
    {
        return DB::transaction(function () use ($service, $url, $specJson): array {
            // Clear existing tools before re-importing
            $service->tools()->delete();

            if ($url) {
                return $this->parser->parseFromUrl($service, $url);
            }

            if ($specJson) {
                return $this->parser->parseFromJson($service, $specJson);
            }

            throw new \InvalidArgumentException('Either url or spec_json must be provided');
        });
    }
}
