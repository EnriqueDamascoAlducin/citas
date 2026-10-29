<?php

namespace App\Http\Controllers\Api;

use App\Models\Service;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvailabilityController
{
    public function __construct(private AvailabilityService $availability) {}

    public function employees(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'service_id' => 'required|exists:services,id',
        ]);

        $date = $request->date ? Carbon::parse($request->date) : null;
        $dayOfWeek = $date?->dayOfWeek;

        $employees = User::role('employee')
            ->when($dayOfWeek !== null, fn ($q) => $q->whereHas('schedules', fn ($sq) => $sq->where('day_of_week', $dayOfWeek)->where('active', true)))
            ->when($date, fn ($q) => $q->whereDoesntHave('scheduleExceptions', fn ($sq) => $sq->whereDate('date', $date)->where('available', false)))
            ->get()
            ->map(fn ($emp) => [
                'id' => $emp->id,
                'name' => $emp->name,
            ]);

        return response()->json($employees);
    }

    public function slots(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|exists:users,id',
            'date' => 'required|date_format:Y-m-d',
            'service_id' => 'required|exists:services,id',
        ]);

        $employee = User::findOrFail($request->employee_id);
        $date = Carbon::parse($request->date);
        $service = Service::findOrFail($request->service_id);

        return response()->json($this->availability->slotsFor($employee, $date, $service));
    }

    public function employeesAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'service_id' => 'required|exists:services,id',
            'exclude_employee_id' => 'nullable|exists:users,id',
        ]);

        $date = Carbon::parse($request->date);
        $service = Service::findOrFail($request->service_id);
        $dayOfWeek = $date->dayOfWeek;

        $employees = User::role('employee')
            ->when($request->exclude_employee_id, fn ($q) => $q->where('id', '!=', $request->exclude_employee_id))
            ->whereHas('schedules', fn ($sq) => $sq->where('day_of_week', $dayOfWeek)->where('active', true))
            ->whereDoesntHave('scheduleExceptions', fn ($sq) => $sq->whereDate('date', $date)->where('available', false))
            ->get()
            ->filter(fn ($emp) => count($this->availability->slotsFor($emp, $date, $service)) > 0)
            ->values()
            ->map(fn ($emp) => [
                'id' => $emp->id,
                'name' => $emp->name,
            ]);

        return response()->json($employees);
    }
}
