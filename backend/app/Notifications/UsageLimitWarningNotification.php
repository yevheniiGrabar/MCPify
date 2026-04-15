<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Team;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class UsageLimitWarningNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Team $team,
        private readonly string $resource,
        private readonly int $used,
        private readonly int $limit,
        private readonly int $percentage,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $resourceLabel = $this->resource === 'calls' ? 'monthly tool calls' : 'services';
        $isExceeded = $this->percentage >= 100;

        $subject = $isExceeded
            ? "MCPify: {$resourceLabel} limit reached"
            : "MCPify: {$this->percentage}% of {$resourceLabel} limit used";

        $message = (new MailMessage())
            ->subject($subject)
            ->greeting("Hi {$notifiable->name},");

        if ($isExceeded) {
            $message->line("Your team **{$this->team->name}** has reached the {$resourceLabel} limit ({$this->used}/{$this->limit}).")
                ->line('New requests may be blocked until you upgrade your plan.')
                ->action('Upgrade Now', config('app.frontend_url') . '/billing');
        } else {
            $message->line("Your team **{$this->team->name}** has used **{$this->percentage}%** of its {$resourceLabel} limit ({$this->used}/{$this->limit}).")
                ->line('Consider upgrading to avoid hitting the limit.')
                ->action('View Usage', config('app.frontend_url') . '/billing');
        }

        return $message->line('Thank you for using MCPify!');
    }
}
