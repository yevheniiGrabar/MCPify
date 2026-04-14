<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'current_team_id' => $this->current_team_id,
            'current_team' => $this->whenLoaded('currentTeam', fn () => [
                'id' => $this->currentTeam->id,
                'name' => $this->currentTeam->name,
                'slug' => $this->currentTeam->slug,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
