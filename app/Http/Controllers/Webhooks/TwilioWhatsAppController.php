<?php

namespace App\Http\Controllers\Webhooks;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Support\PhoneNumber;
use App\Support\WhatsApp\AppointmentReminder;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Twilio\TwiML\MessagingResponse;

/**
 * Twilio llama aquí cada vez que un cliente escribe al WhatsApp. Si responde
 * «Confirmar» al recordatorio, la cita queda confirmada por el cliente.
 */
class TwilioWhatsAppController extends Controller
{
    /** Respuestas escritas a mano que también confirman. */
    private const WORDS = ['confirmar', 'confirmo', 'confirmado', 'si', 'ok', '1'];

    public function __invoke(Request $request): Response
    {
        if (! $this->wantsToConfirm($request->input('ButtonPayload'), $request->input('Body'))) {
            return $this->reply('Para confirmar tu cita toca el botón *Confirmar* del recordatorio o responde *Confirmar*. Si necesitas cambiarla, escríbenos o entra a tu cuenta.');
        }

        $appointment = $this->findAppointment(
            $request->input('OriginalRepliedMessageSid'),
            PhoneNumber::normalize($request->input('From')),
        );

        if (! $appointment) {
            return $this->reply('No encontramos una cita próxima con este número. Si crees que es un error, escríbenos.');
        }

        $when = $appointment->start_time->locale('es')->translatedFormat('l j \d\e F').' a las '.$appointment->start_time->format('H:i');

        if ($appointment->client_confirmed_at) {
            return $this->reply("Tu cita del {$when} ya estaba confirmada. ¡Te esperamos!");
        }

        $appointment->update([
            'client_confirmed_at' => now(),
            'status' => AppointmentStatus::Confirmed->value,
        ]);

        return $this->reply("✅ Listo, confirmaste tu cita del {$when} con {$appointment->employee?->name}. ¡Te esperamos!");
    }

    private function wantsToConfirm(?string $payload, ?string $body): bool
    {
        if ($payload === AppointmentReminder::CONFIRM_BUTTON) {
            return true;
        }

        // Sin acentos, emojis ni signos: «¡Sí!» o «✅ confirmar» cuentan igual.
        $text = trim(preg_replace('/[^a-z0-9 ]+/', '', Str::lower(Str::ascii((string) $body))) ?? '');

        return in_array($text, self::WORDS, true);
    }

    /**
     * La cita a la que responde el mensaje y, si Twilio no lo indica, la más
     * próxima con recordatorio enviado a ese número.
     */
    private function findAppointment(?string $repliedSid, ?string $phone): ?Appointment
    {
        $candidates = Appointment::query()
            ->whereIn('status', [AppointmentStatus::Pending->value, AppointmentStatus::Confirmed->value])
            ->whereNotNull('reminder_sent_at')
            ->where('end_time', '>=', now())
            ->with(['customer', 'client', 'employee']);

        if ($repliedSid) {
            $appointment = (clone $candidates)->where('reminder_message_sid', $repliedSid)->first();

            if ($appointment) {
                return $appointment;
            }
        }

        if (! $phone) {
            return null;
        }

        return $candidates->orderBy('start_time')->get()
            ->first(fn (Appointment $appointment) => PhoneNumber::normalize($appointment->booker()?->phone) === $phone);
    }

    private function reply(string $message): Response
    {
        $twiml = new MessagingResponse;
        $twiml->message($message);

        return response((string) $twiml, 200, ['Content-Type' => 'text/xml']);
    }
}
