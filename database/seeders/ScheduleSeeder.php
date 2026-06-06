<?php

namespace Database\Seeders;

use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $employeeEmails = ['empleado@citas.com', 'carlos@citas.com', 'javier@citas.com', 'miguel@citas.com'];

        $employees = User::whereIn('email', $employeeEmails)->get();

        if ($employees->isEmpty()) {
            return;
        }

        $schedules = [
            ['day_of_week' => Carbon::MONDAY, 'start_time' => '09:00', 'end_time' => '18:00'],
            ['day_of_week' => Carbon::TUESDAY, 'start_time' => '09:00', 'end_time' => '18:00'],
            ['day_of_week' => Carbon::WEDNESDAY, 'start_time' => '09:00', 'end_time' => '18:00'],
            ['day_of_week' => Carbon::THURSDAY, 'start_time' => '09:00', 'end_time' => '18:00'],
            ['day_of_week' => Carbon::FRIDAY, 'start_time' => '09:00', 'end_time' => '18:00'],
            ['day_of_week' => Carbon::SATURDAY, 'start_time' => '09:00', 'end_time' => '14:00'],
        ];

        foreach ($employees as $employee) {
            foreach ($schedules as $schedule) {
                Schedule::firstOrCreate(
                    [
                        'user_id' => $employee->id,
                        'day_of_week' => $schedule['day_of_week'],
                        'start_time' => $schedule['start_time'],
                    ],
                    [
                        'user_id' => $employee->id,
                        'day_of_week' => $schedule['day_of_week'],
                        'start_time' => $schedule['start_time'],
                        'end_time' => $schedule['end_time'],
                        'active' => true,
                    ]
                );
            }
        }
    }
}
