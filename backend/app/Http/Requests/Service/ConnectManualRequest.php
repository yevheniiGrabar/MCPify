<?php

declare(strict_types=1);

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConnectManualRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'http_method' => ['required', 'string', Rule::in(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])],
            'endpoint_path' => ['required', 'string', 'max:500'],
            'input_schema' => ['nullable', 'array'],
            'base_url' => ['nullable', 'url', 'max:2048'],
            'auth_type' => ['nullable', 'string', Rule::in(['bearer', 'api_key', 'basic', 'none'])],
            'auth_config' => ['nullable', 'array'],
        ];
    }
}
