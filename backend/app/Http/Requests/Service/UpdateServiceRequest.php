<?php

declare(strict_types=1);

namespace App\Http\Requests\Service;

use App\Enums\ServiceStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'status' => ['sometimes', Rule::enum(ServiceStatus::class)],
        ];
    }
}
