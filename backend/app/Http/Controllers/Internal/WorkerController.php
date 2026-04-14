<?php

declare(strict_types=1);

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkerController extends Controller
{
    public function serviceConfig(Request $request, string $token): JsonResponse
    {
        // Validate worker secret
        $workerSecret = config('services.mcp_worker.secret');
        if ($request->header('X-Worker-Secret') !== $workerSecret) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $service = Service::where('mcp_url_token', $token)
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->with('apiConfig')
            ->first();

        if (! $service) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $apiConfig = $service->apiConfig;

        return response()->json([
            'data' => [
                'service_id' => $service->id,
                'service_name' => $service->name,
                'base_url' => $apiConfig?->base_url,
                'auth_type' => $apiConfig?->auth_type,
                'auth_config' => $apiConfig?->auth_config, // decrypted via accessor
            ],
        ]);
    }
}
