<?php

namespace App\Http\Resources;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Appointment
 */
class AgendaAppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $client = $this->customer ?? $this->client;

        return [
            'id' => $this->id,
            'start_time' => $this->start_time->format('H:i'),
            'end_time' => $this->end_time->format('H:i'),
            'status' => $this->status,
            'service' => $this->service?->name,
            'duration_minutes' => $this->service?->duration_minutes,
            'client' => [
                'name' => $client?->name ?? 'Cliente eliminado',
                'phone' => $client?->phone,
                'email' => $client?->email,
            ],
            'notes' => $this->notes,
            'products' => $this->products->map(fn ($product) => [
                'name' => $product->name,
                'quantity' => $product->pivot->quantity,
            ]),
            'total_amount' => (float) $this->total_amount,
            'is_paid' => $this->payments->contains(fn ($payment) => in_array($payment->status, ['approved', 'paid'], true)),
        ];
    }
}
