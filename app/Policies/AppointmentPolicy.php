<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    /** Personal que puede abrir la lista de citas (la propia o la de todos). */
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::ViewAppointments->value)
            || $user->can(Permission::ViewAnyAppointment->value);
    }

    public function view(User $user, Appointment $appointment): bool
    {
        return $this->isAssignedOrSupervisor($user, $appointment);
    }

    public function updateStatus(User $user, Appointment $appointment): bool
    {
        return $this->isAssignedOrSupervisor($user, $appointment);
    }

    private function isAssignedOrSupervisor(User $user, Appointment $appointment): bool
    {
        if ($user->can(Permission::ViewAnyAppointment->value)) {
            return true;
        }

        return $user->can(Permission::ViewAppointments->value)
            && $appointment->employee_id === $user->id;
    }
}
