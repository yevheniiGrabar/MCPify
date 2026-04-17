<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email'],
                'token',
            ]);

        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
        $this->assertDatabaseHas('teams', ['name' => "John Doe's Team"]);
    }

    public function test_register_creates_team_and_sets_current_team(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(201);

        $user = User::where('email', 'jane@example.com')->first();
        $this->assertNotNull($user->current_team_id);
        $this->assertDatabaseHas('team_user', ['user_id' => $user->id, 'role' => 'owner']);
    }

    public function test_register_validates_required_fields(): void
    {
        $this->postJson('/api/v1/auth/register', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_register_validates_unique_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'New User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login(): void
    {
        [$user] = $this->createUserWithTeam(['password' => bcrypt('password123')]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email'],
                'token',
            ]);
    }

    public function test_login_fails_with_wrong_credentials(): void
    {
        [$user] = $this->createUserWithTeam(['password' => bcrypt('correct-password')]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(401)
            ->assertJson(['message' => 'Invalid credentials']);
    }

    public function test_user_can_logout(): void
    {
        [$user] = $this->createUserWithTeam();
        $plainTextToken = $user->createToken('auth_token')->plainTextToken;

        $this->withToken($plainTextToken)
            ->postJson('/api/v1/auth/logout')
            ->assertStatus(204);

        // Token should be deleted
        $this->assertEquals(0, $user->tokens()->count());
    }

    public function test_me_returns_current_user(): void
    {
        [$user] = $this->actingAsUser();

        $this->getJson('/api/v1/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertStatus(401);
    }

    public function test_user_can_update_profile(): void
    {
        [$user] = $this->actingAsUser();

        $this->patchJson('/api/v1/auth/profile', [
            'name' => 'Updated Name',
            'email' => $user->email,
        ])->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Updated Name']);
    }

    public function test_update_profile_validates_unique_email(): void
    {
        $other = User::factory()->create(['email' => 'other@example.com']);
        $this->actingAsUser();

        $this->patchJson('/api/v1/auth/profile', [
            'name' => 'Test',
            'email' => 'other@example.com',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_update_password(): void
    {
        [$user] = $this->createUserWithTeam(['password' => bcrypt('old-password')]);
        $this->actingAs($user, 'sanctum');

        $this->putJson('/api/v1/auth/password', [
            'current_password' => 'old-password',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ])->assertStatus(200)
            ->assertJson(['message' => 'Password updated']);
    }

    public function test_update_password_fails_with_wrong_current_password(): void
    {
        $this->actingAsUser(['password' => bcrypt('correct')]);

        $this->putJson('/api/v1/auth/password', [
            'current_password' => 'wrong',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ])->assertStatus(422);
    }

    public function test_user_can_delete_account(): void
    {
        [$user] = $this->actingAsUser();

        $this->deleteJson('/api/v1/auth/account')
            ->assertStatus(204);

        $this->assertDatabaseMissing('users', ['id' => $user->id, 'deleted_at' => null]);
    }

    public function test_forgot_password_sends_reset_link(): void
    {
        Notification::fake();
        [$user] = $this->createUserWithTeam();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])
            ->assertStatus(200);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_forgot_password_returns_422_for_unknown_email(): void
    {
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com'])
            ->assertStatus(422);
    }
}
