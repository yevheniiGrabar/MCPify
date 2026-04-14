<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class ApiConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'type',
        'base_url',
        'auth_type',
        'auth_config',
        'openapi_spec_url',
        'openapi_spec_json',
    ];

    public function setAuthConfigAttribute(mixed $value): void
    {
        $this->attributes['auth_config'] = $value !== null
            ? Crypt::encryptString(is_string($value) ? $value : json_encode($value))
            : null;
    }

    public function getAuthConfigAttribute(mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        try {
            $decrypted = Crypt::decryptString($value);

            return json_decode($decrypted, true) ?? $decrypted;
        } catch (\Exception) {
            return null;
        }
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
