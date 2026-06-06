<?php

namespace App\Http\Controllers\Api;

use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvailabilityController
{
    public function employees(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'service_id' => 'required|exists:services,id',
        ]);

        $service = Service::findOrFail($request->service_id);
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

        $slots = $this->getAvailableSlots($employee, $date, $service);

        return response()->json($slots);
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
            ->filter(fn ($emp) => $this->hasAvailableSlots($emp, $date, $service))
            ->values()
            ->map(fn ($emp) => [
                'id' => $emp->id,
                'name' => $emp->name,
            ]);

        return response()->json($employees);
    }

    private function hasAvailableSlots(User $employee, Carbon $date, Service $service): bool
    {
        return count($this->getAvailableSlots($employee, $date, $service)) > 0;
    }

    private function getAvailableSlots(User $employee, Carbon $date, Service $service): array
    {
        $dayOfWeek = $date->dayOfWeek;

        $exception = $employee->scheduleExceptions()
            ->whereDate('date', $date)
            ->first();

        if ($exception && ! $exception->available) {
            return [];
        }

        if ($exception && $exception->available && $exception->start_time && $exception->end_time) {
            $ranges = [
                [
                    'start' => Carbon::parse($exception->start_time->format('H:i')),
                    'end' => Carbon::parse($exception->end_time->format('H:i')),
                ],
            ];
        } else {
            $schedules = $employee->schedules()
                ->where('day_of_week', $dayOfWeek)
                ->where('active', true)
                ->get();

            if ($schedules->isEmpty()) {
                return [];
            }

            $ranges = $schedules->map(fn ($s) => [
                'start' => Carbon::parse($s->start_time instanceof \DateTimeInterface ? $s->start_time->format('H:i') : $s->start_time),
                'end' => Carbon::parse($s->end_time instanceof \DateTimeInterface ? $s->end_time->format('H:i') : $s->end_time),
            ])->toArray();
        }

        $duration = $service->duration_minutes;
        $existingAppointments = $employee->employeeAppointments()
            ->whereDate('start_time', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->get();

        $slots = [];
        $now = Carbon::now();
        $isToday = $date->isToday();

        foreach ($ranges as $range) {
            $current = $range['start']->copy();
            $end = $range['end']->copy();

            while ($current->copy()->addMinutes($duration)->lte($end)) {
                $slotStart = $current->format('H:i');
                $slotEnd = $current->copy()->addMinutes($duration)->format('H:i');

                if ($isToday && $current->lt($now)) {
                    $current->addMinutes($duration);

                    continue;
                }

                $isAvailable = ! $existingAppointments->contains(function ($apt) use ($slotStart, $slotEnd) {
                    $aptStart = Carbon::parse($apt->start_time)->format('H:i');
                    $aptEnd = Carbon::parse($apt->end_time)->format('H:i');

                    return $slotStart < $aptEnd && $slotEnd > $aptStart;
                });

                if ($isAvailable) {
                    $slots[] = [
                        'time' => $slotStart,
                        'end_time' => $slotEnd,
                        'display' => $slotStart.' - '.$slotEnd,
                    ];
                }

                $current->addMinutes($duration);
            }
        }

        return $slots;
    }
}
