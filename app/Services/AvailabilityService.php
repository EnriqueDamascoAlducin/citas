<?php

namespace App\Services;

use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class AvailabilityService
{
    /**
     * Horarios libres de un empleado para un servicio en una fecha.
     *
     * @return array<int, array{time: string, end_time: string, display: string}>
     */
    public function slotsFor(User $employee, CarbonInterface $date, Service $service): array
    {
        if ($date->copy()->startOfDay()->lt(today())) {
            return [];
        }

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
                ->where('day_of_week', $date->dayOfWeek)
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

    /**
     * ¿El horario que empieza en $startTime (H:i) está libre?
     */
    public function isSlotAvailable(User $employee, CarbonInterface $date, Service $service, string $startTime): bool
    {
        return collect($this->slotsFor($employee, $date, $service))
            ->contains(fn ($slot) => $slot['time'] === $startTime);
    }
}
