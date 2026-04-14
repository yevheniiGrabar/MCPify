<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class RegisterUserAction
{
    public function execute(string $name, string $email, string $password): User
    {
        return DB::transaction(function () use ($name, $email, $password): User {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
            ]);

            $team = Team::create([
                'name' => $name . "'s Team",
            ]);

            $team->users()->attach($user->id, ['role' => 'owner']);

            $user->update(['current_team_id' => $team->id]);

            return $user->fresh(['currentTeam']);
        });
    }
}
