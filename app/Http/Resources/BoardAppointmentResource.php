<?php

namespace App\Http\Resources;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Fila del tablero de recepción. Se ve en una pantalla pública: del cliente
 * solo va el nombre y la inicial del apellido, sin teléfono ni correo.
 *
 * @mixin Appointment
 */
class BoardAppointmentResource extends JsonResource
{
    /** Minutos antes de la hora en que la cita pasa a «Siguiente». */
    private const NEXT_WINDOW_MINUTES = 10;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'time' => $this->start_time->format('H:i'),
            'client' => $this->publicName($this->booker()?->name),
            'service' => $this->service?->name,
            'barber' => $this->employee?->name,
            'state' => $this->state(),
        ];
    }

    /** in_progress, next, confirmed o scheduled. */
    private function state(): string
    {
        $now = now();

        return match (true) {
            $this->start_time->lte($now) => 'in_progress',
            $this->start_time->lte($now->copy()->addMinutes(self::NEXT_WINDOW_MINUTES)) => 'next',
            $this->client_confirmed_at !== null || $this->status === AppointmentStatus::Confirmed->value => 'confirmed',
            default => 'scheduled',
        };
    }

    private function publicName(?string $name): string
    {
        $parts = preg_split('/\s+/', trim((string) $name)) ?: [];

        if (! $parts || $parts[0] === '') {
            return 'Cliente';
        }

        return isset($parts[1]) ? "{$parts[0]} ".Str::upper(Str::substr($parts[1], 0, 1)).'.' : $parts[0];
    }
}
