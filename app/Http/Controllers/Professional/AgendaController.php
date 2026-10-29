<?php

namespace App\Http\Controllers\Professional;

use App\Enums\AppointmentStatus;
use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\ShowAgendaRequest;
use App\Http\Resources\AgendaAppointmentResource;
use App\Models\Appointment;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Agenda del día del barbero que inició sesión.
 */
class AgendaController extends Controller
{
    public function __invoke(ShowAgendaRequest $request): Response
    {
        $employee = $request->user();
        $date = $request->agendaDate();
        $weekStart = $date->startOfWeek(CarbonImmutable::MONDAY);
        $weekEnd = $weekStart->addDays(6);

        $appointments = Appointment::query()
            ->forEmployee($employee)
            ->betweenDates($date, $date)
            ->with(['service', 'customer', 'client', 'products', 'payments'])
            ->orderBy('start_time')
            ->get();

        $weekCounts = Appointment::query()
            ->forEmployee($employee)
            ->active()
            ->betweenDates($weekStart, $weekEnd)
            ->selectRaw('DATE(start_time) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $active = $appointments->reject(fn (Appointment $a) => in_array($a->status, [AppointmentStatus::Cancelled->value, AppointmentStatus::NoShow->value], true));

        $exception = $employee->scheduleExceptions()->whereDate('date', $date)->first();
        // Mismas reglas que AvailabilityService: excepción sin disponibilidad = día libre,
        // excepción con horas = esas horas, si no, el horario semanal.
        $workingHours = match (true) {
            $exception && ! $exception->available => [],
            $exception && $exception->start_time && $exception->end_time => [
                ['start' => $exception->start_time->format('H:i'), 'end' => $exception->end_time->format('H:i')],
            ],
            default => $employee->schedules()
                ->where('day_of_week', $date->dayOfWeek)
                ->where('active', true)
                ->orderBy('start_time')
                ->get()
                ->map(fn ($s) => ['start' => $s->start_time->format('H:i'), 'end' => $s->end_time->format('H:i')])
                ->all(),
        };

        return Inertia::render('professional/agenda', [
            'date' => $date->toDateString(),
            'isToday' => $date->isToday(),
            'appointments' => AgendaAppointmentResource::collection($appointments)->resolve(),
            'summary' => [
                'total' => $active->count(),
                'completed' => $active->where('status', AppointmentStatus::Completed->value)->count(),
                'pending_payment' => $active->where('status', AppointmentStatus::Pending->value)->count(),
                'expected_revenue' => (float) $active->sum('total_amount'),
            ],
            'week' => collect(range(0, 6))->map(function (int $offset) use ($weekStart, $weekCounts) {
                $day = $weekStart->addDays($offset);

                return ['date' => $day->toDateString(), 'count' => (int) ($weekCounts[$day->toDateString()] ?? 0)];
            }),
            'workingHours' => $workingHours,
            'dayOffReason' => $exception && ! $exception->available ? ($exception->reason ?: 'Día libre') : null,
            'canEditSchedule' => $employee->can(Permission::ManageSchedule->value),
        ]);
    }
}
