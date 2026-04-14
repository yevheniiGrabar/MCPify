<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Service;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class HighErrorRateNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Service $service,
        private readonly float $errorRate,
        private readonly int $totalCalls,
        private readonly int $errorCalls,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject("High error rate on {$this->service->name}")
            ->greeting("Alert: {$this->errorRate}% error rate")
            ->line("Your service **{$this->service->name}** has an error rate of {$this->errorRate}% in the last hour.")
            ->line("{$this->errorCalls} out of {$this->totalCalls} tool calls returned errors.")
            ->action('View Audit Log', config('app.frontend_url') . "/services/{$this->service->id}/audit-log")
            ->line('Please investigate and resolve any upstream API issues.');
    }
}
