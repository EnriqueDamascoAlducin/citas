<?php

namespace App\Support\WhatsApp;

use App\Contracts\WhatsAppSender;
use App\Models\Appointment;
use App\Support\PhoneNumber;
use RuntimeException;

/**
 * Recordatorio de cita con el botón «Confirmar». La plantilla de Twilio recibe:
 * {{1}} nombre, {{2}} servicio, {{3}} barbero, {{4}} día y {{5}} hora.
 */
class AppointmentReminder
{
    /** ID del botón de respuesta rápida en la plantilla de Twilio. */
    public const CONFIRM_BUTTON = 'confirm_appointment';

    public function __construct(private WhatsAppSender $whatsApp) {}

    public static function isReady(): bool
    {
        return TwilioWhatsApp::isConfigured() && filled(config('services.twilio.template_appointment_reminder'));
    }

    /** Minutos antes de la cita en que sale el recordatorio. */
    public static function leadMinutes(): int
    {
        return max(5, (int) config('services.twilio.reminder_minutes', 60));
    }

    /**
     * @return string SID del mensaje en Twilio.
     *
     * @throws RuntimeException si falta configuración, el cliente no tiene teléfono o Twilio rechaza el envío.
     */
    public function send(Appointment $appointment): string
    {
        if (! self::isReady()) {
            throw new RuntimeException('Falta configurar Twilio o la plantilla del recordatorio en el .env.');
        }

        $booker = $appointment->booker();
        $phone = PhoneNumber::normalize($booker?->phone);

        if (! $phone) {
            throw new RuntimeException('El cliente no tiene un teléfono válido.');
        }

        return $this->whatsApp->sendTemplate($phone, config('services.twilio.template_appointment_reminder'), [
            '1' => strtok((string) $booker->name, ' ') ?: (string) $booker->name,
            '2' => (string) $appointment->service?->name,
            '3' => (string) $appointment->employee?->name,
            '4' => $appointment->start_time->locale('es')->translatedFormat('l j \d\e F'),
            '5' => $appointment->start_time->format('H:i'),
        ]);
    }
}
