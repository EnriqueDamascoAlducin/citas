<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreScheduleExceptionRequest;
use App\Models\ScheduleException;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleExceptionController extends Controller
{
    public function store(StoreScheduleExceptionRequest $request): RedirectResponse
    {
        $employee = $this->resolveEmployee($request);

        $employee->scheduleExceptions()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Excepción guardada.']);

        return to_route('employee.schedule.index', $request->only('employee_id'));
    }

    public function destroy(Request $request, ScheduleException $exception): RedirectResponse
    {
        $this->authorizeAccess($request, $exception->user_id);

        $exception->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Excepción eliminada.']);

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
