<?php

namespace App\Http\Resources;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Appointment
 */
class CustomerAppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service' => $this->service?->name,
            'employee' => $this->employee?->name,
            'date' => $this->start_time->format('Y-m-d'),
            'start_time' => $this->start_time->format('H:i'),
            'end_time' => $this->end_time->format('H:i'),
            'status' => $this->status,
            'total_amount' => (float) $this->total_amount,
            'notes' => $this->notes,
            'products' => $this->products->map(fn ($product) => [
                'name' => $product->name,
                'quantity' => $product->pivot->quantity,
            ]),
            'is_paid' => $this->payments->contains(fn ($payment) => in_array($payment->status, ['approved', 'paid'], true)),
        ];
    }
}
