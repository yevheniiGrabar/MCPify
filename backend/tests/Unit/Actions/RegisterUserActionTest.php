<?php

declare(strict_types=1);

namespace Tests\Unit\Actions;

use App\Actions\Auth\RegisterUserAction;
use App\Models\User;
use Tests\TestCase;

class RegisterUserActionTest extends TestCase
{
    public function test_creates_user_with_hashed_password(): void
    {
        $action = app(RegisterUserAction::class);
        $user = $action->execute('John Doe', 'john@example.com', 'password123');

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('john@example.com', $user->email);
        $this->assertNotEquals('password123', $user->password);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('password123', $user->password));
    }

    public function test_creates_team_named_after_user(): void
    {
        $action = app(RegisterUserAction::class);
        $user = $action->execute('Jane Smith', 'jane@example.com', 'password');

        $this->assertDatabaseHas('teams', ['name' => "Jane Smith's Team"]);
    }

    public function test_attaches_user_to_team_as_owner(): void
    {
        $action = app(RegisterUserAction::class);
        $user = $action->execute('Bob', 'bob@example.com', 'password');

        $this->assertDatabaseHas('team_user', [
            'user_id' => $user->id,
            'role' => 'owner',
        ]);
    }

    public function test_sets_current_team_on_user(): void
    {
        $action = app(RegisterUserAction::class);
        $user = $action->execute('Alice', 'alice@example.com', 'password');

        $this->assertNotNull($user->current_team_id);
        $this->assertNotNull($user->currentTeam);
    }

    public function test_loads_current_team_relation(): void
    {
        $action = app(RegisterUserAction::class);
        $user = $action->execute('Test', 'test@example.com', 'password');

        $this->assertTrue($user->relationLoaded('currentTeam'));
        $this->assertNotNull($user->currentTeam);
    }
}
