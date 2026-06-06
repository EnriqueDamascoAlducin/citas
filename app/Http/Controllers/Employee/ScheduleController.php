<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreScheduleRequest;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $employee = $this->resolveEmployee($request);

        $employees = $request->user()->can('manage-employees')
            ? User::role('employee')->orderBy('name')->get(['id', 'name'])
            : collect();

        $schedules = $employee->schedules()
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->groupBy('day_of_week');

        return Inertia::render('employee/schedule', [
            'schedules' => $schedules,
            'exceptions' => $employee->scheduleExceptions()
                ->whereDate('date', '>=', now()->subDay())
                ->orderBy('date')
                ->get(),
            'employees' => $employees,
            'selectedEmployeeId' => $employee->id,
        ]);
    }

    public function store(StoreScheduleRequest $request): RedirectResponse
    {
        $employee = $this->resolveEmployee($request);

        $employee->schedules()->updateOrCreate(
            $request->only(['day_of_week', 'start_time', 'end_time']),
            $request->validated()
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Horario agregado.']);

        return to_route('employee.schedule.index', $request->only('employee_id'));
    }

    public function destroy(Request $request, Schedule $schedule): RedirectResponse
    {
        $this->authorizeAccess($request, $schedule->user_id);

        $schedule->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Horario eliminado.']);

        return to_route('employee.schedule.index', $request->only('employee_id'));
    }

    private function resolveEmployee(Request $request): User
    {
        if ($request->employee_id && $request->user()->can('manage-employees')) {
            return User::findOrFail($request->employee_id);
        }

        return $request->user();
    }

    private function authorizeAccess(Request $request, int $ownerId): void
    {
        if ($request->user()->can('manage-employees')) {
            return;
        }

        abort_if($ownerId !== $request->user()->id, 403);
    }
}
