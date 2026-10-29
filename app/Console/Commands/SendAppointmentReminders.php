<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Support\WhatsApp\AppointmentReminder;
use Illuminate\Console\Command;
use Throwable;

/**
 * Corre cada minuto. A las citas que empiezan dentro del tiempo configurado
 * (TWILIO_REMINDER_MINUTES, una hora por omisión) les manda el recordatorio
 * por WhatsApp con el botón «Confirmar». Cada cita lo recibe una sola vez.
 */
class SendAppointmentReminders extends Command
{
    protected $signature = 'citas:whatsapp-recordatorios';

    protected $description = 'Envía por WhatsApp el recordatorio de las citas próximas';

    public function handle(AppointmentReminder $reminder): int
    {
        if (! AppointmentReminder::isReady()) {
            return self::SUCCESS;
        }

        $appointments = Appointment::query()
            ->dueForReminder(AppointmentReminder::leadMinutes())
            ->with(['customer', 'client', 'service', 'employee'])
            ->get();

        foreach ($appointments as $appointment) {
            // Se marca primero: si dos procesos coinciden, solo uno envía.
            $claimed = Appointment::query()
                ->whereKey($appointment->id)
                ->whereNull('reminder_sent_at')
                ->update(['reminder_sent_at' => now()]);

            if (! $claimed) {
                continue;
            }

            try {
                $sid = $reminder->send($appointment);
            } catch (Throwable $exception) {
                report($exception);
                $appointment->update(['reminder_error' => mb_substr($exception->getMessage(), 0, 250)]);

                continue;
            }

            $appointment->update(['reminder_message_sid' => $sid, 'reminder_error' => null]);
            $this->line("Recordatorio de la cita #{$appointment->id} enviado.");
        }

        return self::SUCCESS;
    }
}
