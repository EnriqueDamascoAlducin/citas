<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Inertia\Inertia;

class CustomerDashboardController extends Controller
{
    public function index()
    {
        $appointments = Appointment::with(['service', 'employee', 'products'])
            ->where('customer_id', auth('customer')->id())
            ->orderBy('start_time', 'desc')
            ->get()
            ->map(fn ($apt) => [
                'id' => $apt->id,
                'service' => $apt->service?->name,
                'employee' => $apt->employee?->name,
                'date' => $apt->start_time->format('Y-m-d'),
                'start_time' => $apt->start_time->format('H:i'),
                'end_time' => $apt->end_time->format('H:i'),
                'status' => $apt->status,
                'total_amount' => $apt->total_amount,
                'notes' => $apt->notes,
            ]);

        return Inertia::render('customer/dashboard', [
            'appointments' => $appointments,
            'logoImage' => asset('storage/images/logo.png'),
        ]);
    }
}
