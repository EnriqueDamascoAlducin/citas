<?php

namespace App\Http\Controllers;

use App\Enums\InventoryMovementType;
use App\Http\Requests\StoreAppointmentRequest;
use App\Models\Appointment;
use App\Models\Product;
use App\Models\Service;
use App\Models\User;
use App\Services\AvailabilityService;
use App\Services\InventoryService;
use App\Support\PhoneNumber;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AppointmentController extends Controller
{
    public function store(StoreAppointmentRequest $request, AvailabilityService $availability, InventoryService $inventory): RedirectResponse
    {
        if (! Auth::guard('customer')->check() && ! Auth::check()) {
            return to_route('customer.login');
        }

        $service = Service::where('active', true)->find($request->service_id);
        if (! $service) {
            throw ValidationException::withMessages(['service_id' => 'El servicio no está disponible.']);
        }

        $date = Carbon::parse($request->date);
        $startTime = $date->copy()->setTimeFromTimeString($request->start_time);
        $endTime = $startTime->copy()->addMinutes($service->duration_minutes);

        // Suma cantidades si el mismo producto viene repetido.
        $quantities = collect($request->products ?? [])
            ->groupBy('id')
            ->map(fn ($items) => (int) $items->sum('quantity'));

        $isCustomer = Auth::guard('customer')->check();

        if ($isCustomer && $request->filled('phone')) {
            $request->user('customer')->update(['phone' => PhoneNumber::normalize($request->phone)]);
        }

        // Disco privado: son fotos de la piel del cliente, solo las ve el personal y quien agendó.
        $referencePath = $request->file('reference_image')?->store('references', 'local');

        try {
            $appointment = $this->createAppointment($request, $availability, $inventory, $service, $date, $startTime, $endTime, $quantities, $isCustomer, $referencePath);
        } catch (\Throwable $e) {
            if ($referencePath) {
                Storage::disk('local')->delete($referencePath);
            }

            throw $e;
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cita agendada correctamente.']);

        if ($isCustomer) {
            return to_route('customer.dashboard');
        }

        return to_route('appointments.show', $appointment);
    }

    private function createAppointment(
        StoreAppointmentRequest $request,
        AvailabilityService $availability,
        InventoryService $inventory,
        Service $service,
        Carbon $date,
        Carbon $startTime,
        Carbon $endTime,
        Collection $quantities,
        bool $isCustomer,
        ?string $referencePath,
    ): Appointment {
        return DB::transaction(function () use ($request, $availability, $inventory, $service, $date, $startTime, $endTime, $quantities, $isCustomer, $referencePath) {
            // Bloquea al empleado para que dos reservas simultáneas no tomen el mismo horario.
            $employee = User::role('employee')->lockForUpdate()->find($request->employee_id);
            if (! $employee) {
                throw ValidationException::withMessages(['employee_id' => 'El empleado seleccionado no es válido.']);
            }

            if (! $availability->isSlotAvailable($employee, $date, $service, $startTime->format('H:i'))) {
                throw ValidationException::withMessages(['start_time' => 'Ese horario ya no está disponible. Elige otro.']);
            }

            $products = Product::whereIn('id', $quantities->keys())->lockForUpdate()->get()->keyBy('id');
            $totalAmount = (float) $service->price;

            foreach ($quantities as $id => $quantity) {
                $product = $products->get($id);

                if (! $product || ! $product->active) {
                    throw ValidationException::withMessages(['products' => 'Un producto seleccionado ya no está disponible.']);
                }

                if ($product->stock < $quantity) {
                    throw ValidationException::withMessages(['products' => "Solo quedan {$product->stock} de {$product->name}."]);
                }

                $totalAmount += $product->price * $quantity;
            }

            $appointment = Appointment::create([
                'employee_id' => $employee->id,
                'service_id' => $service->id,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'status' => 'pending',
                'notes' => $request->notes,
                'body_zone' => $request->body_zone,
                'tattoo_size' => $request->tattoo_size,
                'reference_image_path' => $referencePath,
                'total_amount' => $totalAmount,
                // El anticipo aparta el servicio; los productos se pagan el día de la cita.
                'deposit_amount' => $service->deposit_amount,
                'age_confirmed_at' => now(),
                ...($isCustomer
                    ? ['customer_id' => Auth::guard('customer')->id()]
                    : ['user_id' => $request->user()->id]),
            ]);

            foreach ($quantities as $id => $quantity) {
                $product = $products->get($id);

                $appointment->products()->attach($product->id, [
                    'quantity' => $quantity,
                    'price' => $product->price,
                ]);

                $inventory->move($product, -$quantity, InventoryMovementType::OnlineOrder, null, $appointment);
            }

            return $appointment;
        });
    }

    /** Foto de referencia: la ve quien agendó, el tatuador asignado o quien supervisa todas las citas. */
    public function referenceImage(Appointment $appointment): StreamedResponse
    {
        $customerId = Auth::guard('customer')->id();
        $user = Auth::user();

        $allowed = ($customerId && $appointment->customer_id === $customerId)
            || ($user && ($appointment->user_id === $user->id || $user->can('view', $appointment)));

        abort_unless($allowed, 403);
        abort_unless($appointment->reference_image_path && Storage::disk('local')->exists($appointment->reference_image_path), 404);

        return Storage::disk('local')->response($appointment->reference_image_path);
    }
}
