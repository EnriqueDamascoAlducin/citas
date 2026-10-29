<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAppointmentRequest;
use App\Models\Appointment;
use App\Models\Product;
use App\Models\Service;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    public function store(StoreAppointmentRequest $request, AvailabilityService $availability): RedirectResponse
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

        $appointment = DB::transaction(function () use ($request, $availability, $service, $date, $startTime, $endTime, $quantities, $isCustomer) {
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
                'total_amount' => $totalAmount,
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

                $product->decrement('stock', $quantity);
            }

            return $appointment;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cita agendada correctamente.']);

        if ($isCustomer) {
            return to_route('customer.dashboard');
        }

        return to_route('appointments.show', $appointment);
    }
}
