<?php

use App\Contracts\WhatsAppSender;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Twilio\Security\RequestValidator;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    config([
        'services.twilio.sid' => 'AC_test',
        'services.twilio.token' => 'secret-token',
        'services.twilio.whatsapp_from' => 'whatsapp:+14155238886',
        'services.twilio.template_appointment_reminder' => 'HX_reminder',
        'services.twilio.reminder_minutes' => 60,
        'services.twilio.webhook_url' => 'https://citas.test/webhooks/twilio/whatsapp',
    ]);

    // Guarda los envíos en lugar de llamar a Twilio.
    $this->sent = new ArrayObject;
    $sent = $this->sent;
    app()->instance(WhatsAppSender::class, new class($sent) implements WhatsAppSender
    {
        public bool $fail = false;

        public function __construct(private ArrayObject $sent) {}

        public function sendTemplate(string $toE164, string $contentSid, array $variables = []): string
        {
            if ($this->fail) {
                throw new RuntimeException('Twilio rechazó el envío');
            }

            $this->sent[] = compact('toE164', 'contentSid', 'variables');

            return 'SM'.count($this->sent);
        }
    });

    $this->service = Service::create(['name' => 'Corte', 'description' => 'Corte', 'duration_minutes' => 30, 'price' => 200, 'active' => true]);
    $this->barber = User::factory()->create(['name' => 'Carlos Martínez']);
    $this->barber->assignRole('employee');
    $this->customer = Customer::create(['name' => 'Ana López', 'email' => 'ana@example.com', 'phone' => '+525512345678', 'password' => 'password']);
});

function reminderAppointment(array $overrides = []): Appointment
{
    $start = now()->addMinutes(45)->startOfMinute();

    return Appointment::create([
        'customer_id' => test()->customer->id,
        'employee_id' => test()->barber->id,
        'service_id' => test()->service->id,
        'start_time' => $start,
        'end_time' => $start->copy()->addMinutes(30),
        'status' => 'pending',
        'total_amount' => 200,
        ...$overrides,
    ]);
}

function twilioPost(array $params, bool $signed = true)
{
    $url = config('services.twilio.webhook_url');
    $signature = $signed ? (new RequestValidator('secret-token'))->computeSignature($url, $params) : 'invalid';

    return test()->post('/webhooks/twilio/whatsapp', $params, ['X-Twilio-Signature' => $signature]);
}

describe('teléfono obligatorio', function () {
    test('el registro de clientes exige un teléfono válido', function (?string $phone) {
        $this->post('/cliente/register', [
            'name' => 'Luis', 'email' => 'luis@example.com', 'phone' => $phone,
            'password' => 'password', 'password_confirmation' => 'password',
        ])->assertSessionHasErrors('phone');
    })->with([null, '123', 'abc5512345678']);

    test('el teléfono se guarda en formato de WhatsApp', function () {
        $this->post('/cliente/register', [
            'name' => 'Luis', 'email' => 'luis@example.com', 'phone' => '55 1234 9999',
            'password' => 'password', 'password_confirmation' => 'password',
        ])->assertSessionHasNoErrors();

        expect(Customer::where('email', 'luis@example.com')->value('phone'))->toBe('+525512349999');
    });

    test('al agendar se pide el teléfono si la cuenta no tiene', function () {
        $this->customer->update(['phone' => null]);

        $this->actingAs($this->customer, 'customer')
            ->post('/appointments', [])
            ->assertSessionHasErrors('phone');
    });

    test('no se pide si la cuenta ya tiene teléfono', function () {
        $this->actingAs($this->customer, 'customer')
            ->post('/appointments', [])
            ->assertSessionDoesntHaveErrors('phone');
    });
});

describe('recordatorio', function () {
    test('sale una sola vez para las citas de la próxima hora', function () {
        $soon = reminderAppointment();
        $later = reminderAppointment(['start_time' => now()->addHours(3), 'end_time' => now()->addHours(3)->addMinutes(30)]);
        $cancelled = reminderAppointment(['status' => 'cancelled']);

        $this->artisan('citas:whatsapp-recordatorios')->assertSuccessful();
        $this->artisan('citas:whatsapp-recordatorios')->assertSuccessful();

        expect($this->sent)->toHaveCount(1)
            ->and($this->sent[0]['toE164'])->toBe('+525512345678')
            ->and($this->sent[0]['contentSid'])->toBe('HX_reminder')
            ->and($this->sent[0]['variables']['1'])->toBe('Ana')
            ->and($this->sent[0]['variables']['3'])->toBe('Carlos Martínez')
            ->and($soon->fresh()->reminder_message_sid)->toBe('SM1')
            ->and($later->fresh()->reminder_sent_at)->toBeNull()
            ->and($cancelled->fresh()->reminder_sent_at)->toBeNull();
    });

    test('respeta los minutos configurados', function () {
        config(['services.twilio.reminder_minutes' => 30]);
        reminderAppointment();

        $this->artisan('citas:whatsapp-recordatorios');

        expect($this->sent)->toHaveCount(0);
    });

    test('si Twilio falla queda el error y no se reintenta', function () {
        app(WhatsAppSender::class)->fail = true;
        $appointment = reminderAppointment();

        $this->artisan('citas:whatsapp-recordatorios');

        expect($appointment->fresh())
            ->reminder_sent_at->not->toBeNull()
            ->reminder_error->toBe('Twilio rechazó el envío');
    });

    test('sin Twilio configurado no hace nada', function () {
        config(['services.twilio.template_appointment_reminder' => null]);
        reminderAppointment();

        $this->artisan('citas:whatsapp-recordatorios');

        expect($this->sent)->toHaveCount(0);
    });
});

describe('botón Confirmar', function () {
    test('rechaza peticiones sin firma de Twilio', function () {
        twilioPost(['From' => 'whatsapp:+5215512345678', 'ButtonPayload' => 'confirm_appointment'], signed: false)
            ->assertForbidden();
    });

    test('confirma la cita a la que responde', function () {
        $appointment = reminderAppointment(['reminder_sent_at' => now(), 'reminder_message_sid' => 'SM_abc']);

        twilioPost([
            'From' => 'whatsapp:+5215512345678',
            'ButtonPayload' => 'confirm_appointment',
            'OriginalRepliedMessageSid' => 'SM_abc',
        ])->assertOk()->assertSee('confirmaste tu cita', false);

        expect($appointment->fresh())
            ->status->toBe('confirmed')
            ->client_confirmed_at->not->toBeNull();
    });

    test('escribir «sí» confirma la próxima cita de ese número', function () {
        $appointment = reminderAppointment(['reminder_sent_at' => now()]);

        twilioPost(['From' => 'whatsapp:+5215512345678', 'Body' => '¡Sí!'])->assertOk();

        expect($appointment->fresh()->client_confirmed_at)->not->toBeNull();
    });

    test('otro número no confirma citas ajenas', function () {
        $appointment = reminderAppointment(['reminder_sent_at' => now()]);

        twilioPost(['From' => 'whatsapp:+5215599999999', 'ButtonPayload' => 'confirm_appointment'])
            ->assertOk()->assertSee('No encontramos una cita', false);

        expect($appointment->fresh()->client_confirmed_at)->toBeNull();
    });
});

describe('tablero de recepción', function () {
    test('muestra las próximas citas sin datos personales', function () {
        reminderAppointment(['client_confirmed_at' => now()]);
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->get('/tablero')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('board')
                ->has('rows', 1)
                ->where('rows.0.client', 'Ana L.')
                ->where('rows.0.barber', 'Carlos Martínez')
                ->where('rows.0.state', 'confirmed')
                ->missing('rows.0.phone'));
    });

    test('un barbero sin el permiso no lo ve', function () {
        $this->actingAs($this->barber)->get('/tablero')->assertForbidden();
    });
});
