<?php

use App\Enums\TattooSize;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Storage::fake('local');

    $this->date = now()->addDays(2)->format('Y-m-d');

    $this->service = Service::create([
        'name' => 'Tatuaje Mediano',
        'duration_minutes' => 120,
        'price' => 1800,
        'deposit_amount' => 500,
        'active' => true,
    ]);

    $this->artist = User::factory()->create();
    $this->artist->assignRole('employee');

    Schedule::create([
        'user_id' => $this->artist->id,
        'day_of_week' => now()->addDays(2)->dayOfWeek,
        'start_time' => '10:00',
        'end_time' => '18:00',
        'active' => true,
    ]);

    $this->customer = Customer::create([
        'name' => 'Ana',
        'email' => 'ana@tattoo.test',
        'phone' => '+525512345678',
        'password' => 'secreto123',
    ]);
});

function tattooPayload(array $overrides = []): array
{
    $test = test();

    return [
        'service_id' => $test->service->id,
        'employee_id' => $test->artist->id,
        'date' => $test->date,
        'start_time' => '10:00',
        'products' => [],
        'age_confirmed' => true,
        ...$overrides,
    ];
}

test('guarda zona, tamaño, foto de referencia y el anticipo del servicio', function () {
    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), tattooPayload([
            'body_zone' => 'Antebrazo',
            'tattoo_size' => TattooSize::Medium->value,
            'reference_image' => UploadedFile::fake()->image('rosa.jpg', 600, 600),
        ]))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('customer.dashboard'));

    $appointment = Appointment::sole();

    expect($appointment->body_zone)->toBe('Antebrazo')
        ->and($appointment->tattoo_size)->toBe(TattooSize::Medium)
        ->and((float) $appointment->deposit_amount)->toBe(500.0)
        ->and($appointment->amountDueOnline())->toBe(500.0)
        ->and($appointment->age_confirmed_at)->not->toBeNull()
        ->and($appointment->end_time->format('H:i'))->toBe('12:00');

    Storage::disk('local')->assertExists($appointment->reference_image_path);
});

test('exige confirmar la mayoría de edad', function () {
    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), tattooPayload(['age_confirmed' => false]))
        ->assertSessionHasErrors('age_confirmed');

    expect(Appointment::count())->toBe(0);
});

test('rechaza archivos que no son imagen', function () {
    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), tattooPayload([
            'reference_image' => UploadedFile::fake()->create('virus.pdf', 100, 'application/pdf'),
        ]))
        ->assertSessionHasErrors('reference_image');
});

test('si el horario ya no está libre no deja la foto huérfana', function () {
    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), tattooPayload([
            'start_time' => '20:00',
            'reference_image' => UploadedFile::fake()->image('rosa.jpg'),
        ]))
        ->assertSessionHasErrors('start_time');

    expect(Storage::disk('local')->allFiles('references'))->toBe([]);
});

test('la foto de referencia solo la ven quien agendó y el tatuador asignado', function () {
    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), tattooPayload([
            'reference_image' => UploadedFile::fake()->image('rosa.jpg'),
        ]));

    $appointment = Appointment::sole();
    $url = route('appointments.reference-image', $appointment);

    $this->get($url)->assertOk();

    $this->actingAs($this->artist)->get($url)->assertOk();

    $otherArtist = User::factory()->create();
    $otherArtist->assignRole('employee');
    $this->actingAs($otherArtist)->get($url)->assertForbidden();
});

test('un anónimo no puede ver la foto de referencia', function () {
    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), tattooPayload([
            'reference_image' => UploadedFile::fake()->image('rosa.jpg'),
        ]));

    auth('customer')->logout();

    $this->get(route('appointments.reference-image', Appointment::sole()))->assertForbidden();
});

test('el anticipo no puede ser mayor que el precio', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post(route('admin.services.store'), [
            'name' => 'Retoque',
            'duration_minutes' => 30,
            'price' => 300,
            'deposit_amount' => 500,
            'active' => true,
        ])
        ->assertSessionHasErrors('deposit_amount');
});

test('un servicio sin anticipo guarda 0', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post(route('admin.services.store'), [
            'name' => 'Perforación',
            'duration_minutes' => 30,
            'price' => 450,
            'active' => true,
        ])
        ->assertSessionHasNoErrors();

    expect((float) Service::where('name', 'Perforación')->value('deposit_amount'))->toBe(0.0);
});
