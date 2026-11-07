<?php

namespace App\Observers;

use App\Enums\AppointmentStatus;
use App\Enums\InventoryMovementType;
use App\Models\Appointment;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Los productos apartados en una cita regresan al inventario si la cita se
 * cancela o el cliente no llega, venga el cambio del personal o del cliente.
 */
class AppointmentObserver
{
    private const OPEN = [AppointmentStatus::Pending->value, AppointmentStatus::Confirmed->value];

    private const RELEASED = [AppointmentStatus::Cancelled->value, AppointmentStatus::NoShow->value];

    public function __construct(private InventoryService $inventory) {}

    public function updated(Appointment $appointment): void
    {
        if (! $appointment->wasChanged('status')
            || ! in_array($appointment->getOriginal('status'), self::OPEN, true)
            || ! in_array($appointment->status, self::RELEASED, true)) {
            return;
        }

        $items = $appointment->products()->get();

        if ($items->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($appointment, $items) {
            $products = Product::whereIn('id', $items->pluck('id'))->lockForUpdate()->get()->keyBy('id');
            $reason = $appointment->status === AppointmentStatus::NoShow->value ? 'El cliente no asistió' : 'Cita cancelada';

            foreach ($items as $item) {
                $this->inventory->move(
                    $products[$item->id],
                    (int) $item->pivot->quantity,
                    InventoryMovementType::OnlineCancelled,
                    Auth::guard('web')->user(),
                    $appointment,
                    $reason,
                );
            }
        });
    }
}
