<?php

declare(strict_types=1);

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

class ConnectOpenApiRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'url' => ['nullable', 'url', 'max:2048', 'required_without:spec_json'],
            'spec_json' => ['nullable', 'string', 'required_without:url'],
        ];
    }
}
