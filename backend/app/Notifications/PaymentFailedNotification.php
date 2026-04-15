<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Team;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class PaymentFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Team $team,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('MCPify: Payment failed — action required')
            ->greeting("Hi {$notifiable->name},")
            ->line("We were unable to process the payment for your team **{$this->team->name}**.")
            ->line('Your subscription will remain active for **3 days** (grace period). After that, your account will be downgraded to the Free plan.')
            ->action('Update Payment Method', config('app.frontend_url') . '/billing')
            ->line('If you believe this is an error, please contact support.');
    }
}
