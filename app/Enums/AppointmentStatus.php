<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case NoShow = 'no_show';

    /** Estados a los que el personal puede mover una cita. */
    public static function staffTransitions(): array
    {
        return [self::Confirmed, self::Completed, self::Cancelled, self::NoShow];
    }
}
