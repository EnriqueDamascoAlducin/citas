<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = $user->hasRole('admin') || $user->hasRole('super-admin');

        $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : today();
        $dateTo = $request->date_to ? Carbon::parse($request->date_to) : clone $dateFrom;

        $appointments = Appointment::with(['client', 'customer', 'employee', 'service', 'products'])
            ->when(! $isAdmin, fn ($q) => $q->where('employee_id', $user->id))
            ->when($isAdmin && $request->employee_id, fn ($q) => $q->where('employee_id', $request->employee_id))
            ->whereDate('start_time', '>=', $dateFrom)
            ->whereDate('start_time', '<=', $dateTo)
            ->orderBy('start_time')
            ->paginate(20)
            ->through(fn ($apt) => [
                'id' => $apt->id,
                'client_name' => $apt->customer?->name ?? $apt->client?->name ?? '—',
                'client_email' => $apt->customer?->email ?? $apt->client?->email ?? '—',
                'employee_name' => $apt->employee?->name,
                'service' => $apt->service?->name,
                'start_time' => $apt->start_time->format('H:i'),
                'end_time' => $apt->end_time->format('H:i'),
                'date' => $apt->start_time->format('Y-m-d'),
                'status' => $apt->status,
                'notes' => $apt->notes,
                'total_amount' => $apt->total_amount,
            ]);

        $employees = $isAdmin ? User::role('employee')->orderBy('name')->get(['id', 'name']) : collect();

        return Inertia::render('employee/appointments', [
            'appointments' => static::paginateResponse($appointments),
            'date_from' => $dateFrom->format('Y-m-d'),
            'date_to' => $dateTo->format('Y-m-d'),
            'is_admin' => $isAdmin,
            'employees' => $employees,
            'employee_id' => $request->employee_id ?? '',
        ]);
    }

    public function updateStatus(Request $request, Appointment $appointment): RedirectResponse
    {
        $user = $request->user();
        $isAdmin = $user->hasRole('admin') || $user->hasRole('super-admin');

        if (! $isAdmin && $appointment->employee_id !== $user->id) {
            abort(403);
        }

        $request->validate(['status' => 'required|in:confirmed,completed,cancelled']);

        $appointment->update(['status' => $request->status]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cita actualizada.']);

        return to_route('employee.appointments.index');
    }
}
