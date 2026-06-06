<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function index(Request $request): Response
    {
        $appointments = Appointment::with(['service', 'employee', 'products', 'payments'])
            ->where('user_id', $request->user()->id)
            ->orderBy('start_time', 'desc')
            ->paginate(10);

        return Inertia::render('my-appointments/index', [
            'appointments' => static::paginateResponse($appointments),
        ]);
    }

    public function cancel(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_if($appointment->user_id !== $request->user()->id, 403);
        abort_if(! in_array($appointment->status, ['pending', 'confirmed']), 400);

        $appointment->update(['status' => 'cancelled']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cita cancelada.']);

        return to_route('my-appointments.index');
    }
}
