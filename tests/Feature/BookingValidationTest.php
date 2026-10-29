<?php

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->date = now()->addDays(2)->format('Y-m-d');

    $this->service = Service::create([
        'name' => 'Corte',
        'description' => 'Corte clásico',
        'duration_minutes' => 30,
        'price' => 200,
        'active' => true,
    ]);

    $this->employee = User::factory()->create();
    $this->employee->assignRole('employee');

    Schedule::create([
        'user_id' => $this->employee->id,
        'day_of_week' => now()->addDays(2)->dayOfWeek,
        'start_time' => '09:00',
        'end_time' => '12:00',
        'active' => true,
    ]);

    $this->customer = Customer::create([
        'name' => 'Ana',
        'email' => 'ana@citas.test',
        'phone' => '+525512345678',
        'password' => 'secreto123',
    ]);
});

function bookingPayload(array $overrides = []): array
{
    $test = test();

    return [
        'service_id' => $test->service->id,
        'employee_id' => $test->employee->id,
        'date' => $test->date,
        'start_time' => '10:00',
        'end_time' => '10:30',
        'products' => [],
        ...$overrides,
    ];
}

test('agenda una cita en un horario libre y calcula el fin con la duración', function () {
    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), bookingPayload(['end_time' => '18:00']))
        ->assertRedirect(route('customer.dashboard'));

    $appointment = Appointment::sole();

    expect($appointment->start_time->format('H:i'))->toBe('10:00')
        ->and($appointment->end_time->format('H:i'))->toBe('10:30')
        ->and($appointment->customer_id)->toBe($this->customer->id)
        ->and((float) $appointment->total_amount)->toBe(200.0);
});

test('no permite reservar dos veces el mismo horario', function () {
    $this->actingAs($this->customer, 'customer');

    $this->post(route('appointments.store'), bookingPayload());
    $this->post(route('appointments.store'), bookingPayload())
        ->assertSessionHasErrors('start_time');

    expect(Appointment::count())->toBe(1);
});

test('rechaza horarios fuera del horario del empleado', function () {
    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), bookingPayload(['start_time' => '15:00']))
        ->assertSessionHasErrors('start_time');

    expect(Appointment::count())->toBe(0);
});

test('rechaza fechas pasadas', function () {
    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), bookingPayload(['date' => now()->subDay()->format('Y-m-d')]))
        ->assertSessionHasErrors('date');
});

test('rechaza un empleado que no tiene el rol employee', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), bookingPayload(['employee_id' => $admin->id]))
        ->assertSessionHasErrors('employee_id');
});

test('rechaza servicios inactivos', function () {
    $this->service->update(['active' => false]);

    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), bookingPayload())
        ->assertSessionHasErrors('service_id');
});

test('valida stock y no lo deja en negativo', function () {
    $product = Product::create(['name' => 'Cera', 'price' => 100, 'stock' => 2, 'active' => true]);

    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), bookingPayload([
            'products' => [['id' => $product->id, 'quantity' => 2], ['id' => $product->id, 'quantity' => 1]],
        ]))
        ->assertSessionHasErrors('products');

    expect($product->fresh()->stock)->toBe(2)
        ->and(Appointment::count())->toBe(0);
});

test('descuenta stock y suma productos al total', function () {
    $product = Product::create(['name' => 'Cera', 'price' => 100, 'stock' => 5, 'active' => true]);

    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), bookingPayload([
            'products' => [['id' => $product->id, 'quantity' => 2]],
        ]))
        ->assertSessionHasNoErrors();

    expect($product->fresh()->stock)->toBe(3)
        ->and((float) Appointment::sole()->total_amount)->toBe(400.0);
});

test('rechaza productos inactivos', function () {
    $product = Product::create(['name' => 'Cera', 'price' => 100, 'stock' => 5, 'active' => false]);

    $this->actingAs($this->customer, 'customer')
        ->post(route('appointments.store'), bookingPayload([
            'products' => [['id' => $product->id, 'quantity' => 1]],
        ]))
        ->assertSessionHasErrors('products');
});

test('la API no ofrece horarios en fechas pasadas', function () {
    $this->getJson(route('api.slots', [
        'employee_id' => $this->employee->id,
        'service_id' => $this->service->id,
        'date' => now()->subWeek()->format('Y-m-d'),
    ]))->assertOk()->assertExactJson([]);
});
