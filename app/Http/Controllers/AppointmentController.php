<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAppointmentRequest;
use App\Models\Appointment;
use App\Models\Product;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    public function store(StoreAppointmentRequest $request): RedirectResponse
    {
        if (! Auth::guard('customer')->check() && ! Auth::check()) {
            return to_route('customer.login');
        }

        $service = Service::findOrFail($request->service_id);
        $date = Carbon::parse($request->date);
        $startTime = Carbon::parse($request->start_time);
        $endTime = Carbon::parse($request->end_time);

        $totalAmount = $service->price;

        $productItems = [];
        if ($request->products) {
            foreach ($request->products as $item) {
                $product = Product::findOrFail($item['id']);
                $productItems[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                ];
                $totalAmount += $product->price * $item['quantity'];
            }
        }

        $data = [
            'employee_id' => $request->employee_id,
            'service_id' => $request->service_id,
            'start_time' => $date->copy()->setTimeFrom($startTime),
            'end_time' => $date->copy()->setTimeFrom($endTime),
            'status' => 'pending',
            'notes' => $request->notes,
            'total_amount' => $totalAmount,
        ];

        $isCustomer = Auth::guard('customer')->check();
        if ($isCustomer) {
            $data['customer_id'] = Auth::guard('customer')->id();
        } else {
            $data['user_id'] = $request->user()->id;
        }

        $appointment = Appointment::create($data);

        foreach ($productItems as $item) {
            $appointment->products()->attach($item['product']->id, [
                'quantity' => $item['quantity'],
                'price' => $item['product']->price,
            ]);

            $item['product']->decrement('stock', $item['quantity']);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cita agendada correctamente.']);

        if ($isCustomer) {
            return to_route('customer.dashboard');
        }

        return to_route('appointments.show', $appointment);
    }
}
