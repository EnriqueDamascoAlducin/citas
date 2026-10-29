<?php

namespace App\Http\Controllers\Employee;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAppointmentStatusRequest;
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
        $isAdmin = $user->can(Permission::ViewAnyAppointment->value);

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

    public function updateStatus(UpdateAppointmentStatusRequest $request, Appointment $appointment): RedirectResponse
    {
        $appointment->update(['status' => $request->validated('status')]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cita actualizada.']);

        // Lo usan la lista de citas y la agenda del profesional; back() conserva sus filtros.
        return back();
    }
}
