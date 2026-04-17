<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RestrictToWorker
{
    public function handle(Request $request, Closure $next): Response
    {
        $allowedIps = array_map(
            'trim',
            explode(',', config('services.mcp_worker.allowed_ips', '127.0.0.1,::1'))
        );

        if (! in_array($request->ip(), $allowedIps, true)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
