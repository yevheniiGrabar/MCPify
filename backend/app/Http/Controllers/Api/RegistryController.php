<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RegistryServer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class RegistryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = RegistryServer::query()->where('is_public', true);

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%")
                    ->orWhereRaw("tags::text ilike ?", ["%{$search}%"]);
            });
        }

        if ($request->filled('pricing')) {
            $query->where('pricing_type', $request->string('pricing'));
        }

        $sort = $request->string('sort', 'popular')->toString();
        match ($sort) {
            'newest' => $query->orderByDesc('created_at'),
            'rating' => $query->orderByDesc('rating_avg'),
            default => $query->orderByDesc('install_count'),
        };

        $servers = $query->paginate(24);

        return response()->json([
            'data' => $servers->items(),
            'meta' => [
                'total' => $servers->total(),
                'per_page' => $servers->perPage(),
                'current_page' => $servers->currentPage(),
                'last_page' => $servers->lastPage(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $server = RegistryServer::query()
            ->where('slug', $slug)
            ->where('is_public', true)
            ->firstOrFail();

        $server->increment('install_count');

        return response()->json(['data' => $server]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:registry_servers,slug', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['required', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'endpoint_url' => ['required', 'url'],
            'auth_type' => ['required', 'in:api_key,oauth,none'],
            'github_url' => ['nullable', 'url'],
            'docs_url' => ['nullable', 'url'],
            'pricing_type' => ['required', 'in:free,paid'],
            'price_monthly' => ['nullable', 'integer', 'min:0'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'version' => ['nullable', 'string', 'max:20'],
            'logo_url' => ['nullable', 'url'],
        ]);

        $server = RegistryServer::create($validated);

        return response()->json(['data' => $server], 201);
    }

    public function connect(string $slug): JsonResponse
    {
        $server = RegistryServer::query()
            ->where('slug', $slug)
            ->where('is_public', true)
            ->firstOrFail();

        $server->increment('install_count');

        $config = [
            'mcpServers' => [
                $server->slug => [
                    'url' => $server->endpoint_url,
                    'auth' => $server->auth_type !== 'none' ? 'Bearer YOUR_API_KEY' : null,
                ],
            ],
        ];

        return response()->json([
            'data' => [
                'server' => $server,
                'config' => $config,
                'instructions' => [
                    'claude_desktop' => '~/Library/Application Support/Claude/claude_desktop_config.json',
                    'cursor' => '~/.cursor/mcp.json',
                ],
            ],
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = RegistryServer::query()
            ->where('is_public', true)
            ->selectRaw('category, count(*) as count')
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();

        return response()->json(['data' => $categories]);
    }
}
