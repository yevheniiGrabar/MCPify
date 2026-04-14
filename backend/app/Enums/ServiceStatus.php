<?php

declare(strict_types=1);

namespace App\Enums;

enum ServiceStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case Paused = 'paused';
}
