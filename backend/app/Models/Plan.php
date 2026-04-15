<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'slug',
        'display_name',
        'price',
        'services_limit',
        'calls_per_month',
        'features',
        'freemius_plan_id',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price'           => 'integer',
        'services_limit'  => 'integer',
        'calls_per_month' => 'integer',
        'features'        => 'array',
        'is_active'       => 'boolean',
        'sort_order'      => 'integer',
    ];
}
