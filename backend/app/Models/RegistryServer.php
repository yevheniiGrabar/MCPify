<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

final class RegistryServer extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'registry_servers';

    protected $fillable = [
        'org_id',
        'name',
        'slug',
        'description',
        'category',
        'endpoint_url',
        'auth_type',
        'schema_json',
        'version',
        'is_public',
        'is_verified',
        'install_count',
        'rating_avg',
        'pricing_type',
        'price_monthly',
        'logo_url',
        'tags',
        'github_url',
        'docs_url',
    ];

    protected $casts = [
        'schema_json' => 'array',
        'tags' => 'array',
        'is_public' => 'boolean',
        'is_verified' => 'boolean',
        'install_count' => 'integer',
        'rating_avg' => 'decimal:2',
        'price_monthly' => 'integer',
    ];
}
