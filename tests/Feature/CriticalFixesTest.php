<?php

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Database\QueryException;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
});

function userWithRole(?string $role = null): User
{
    $user = User::factory()->create();

    if ($role) {
        $user->assignRole($role);
    }

    return $user;
}

function makeAppointment(array $overrides = []): Appointment
{
    $service = Service::create([
        'name' => 'Corte',
        'description' => 'Corte clásico',
        'duration_minutes' => 30,
        'price' => 200,
        'active' => true,
    ]);

    return Appointment::create([
        'employee_id' => userWithRole('employee')->id,
        'service_id' => $service->id,
        'start_time' => now()->addDay()->setTime(10, 0),
        'end_time' => now()->addDay()->setTime(10, 30),
        'status' => 'pending',
        'total_amount' => 200,
        ...$overrides,
    ]);
}

describe('acceso al admin', function () {
    test('un usuario registrado sin rol no entra al admin ni a empleado', function () {
        $this->actingAs(userWithRole());

        $this->get(route('admin.dashboard'))->assertForbidden();
        $this->get(route('admin.customers.index'))->assertForbidden();
        $this->get(route('employee.appointments.index'))->assertForbidden();
    });

    test('un usuario sin rol no puede borrar usuarios', function () {
        $victim = userWithRole('employee');

        $this->actingAs(userWithRole('client'))
            ->delete(route('admin.users.destroy', $victim))
            ->assertForbidden();

        expect(User::find($victim->id))->not->toBeNull();
    });

    test('admin y super-admin entran al dashboard', function (string $role) {
        $this->actingAs(userWithRole($role))
            ->get(route('admin.dashboard'))
            ->assertOk();
    })->with(['admin', 'super-admin']);

    test('un admin no puede asignar el rol super-admin', function () {
        $this->actingAs(userWithRole('admin'))
            ->post(route('admin.users.store'), [
                'name' => 'Nuevo',
                'email' => 'nuevo@citas.test',
                'password' => 'password123',
                'role' => 'super-admin',
            ])
            ->assertSessionHasErrors('role');
    });
});

test('el hash de la contraseña del cliente no llega al frontend', function () {
    $customer = Customer::create([
        'name' => 'Ana',
        'email' => 'ana@citas.test',
        'password' => 'secreto123',
    ]);

    $this->actingAs($customer, 'customer')
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('auth.customer.email', 'ana@citas.test')
            ->missing('auth.customer.password')
            ->missing('auth.customer.remember_token'));
});

describe('webhook de Mercado Pago', function () {
    test('ignora notificaciones que no son de pago', function () {
        $this->postJson('/webhook/mercadopago', ['type' => 'plan', 'data' => ['id' => '1']])
            ->assertOk()
            ->assertJson(['message' => 'ignored']);
    });

    test('rechaza firmas inválidas cuando hay secreto configurado', function () {
        config(['services.mercadopago.webhook_secret' => 'secreto']);

        $this->postJson('/webhook/mercadopago?type=payment&data.id=123', [], [
            'x-signature' => 'ts=1700000000,v1=firmafalsa',
            'x-request-id' => 'abc',
        ])->assertUnauthorized();
    });

    test('rechaza notificaciones sin firma cuando hay secreto configurado', function () {
        config(['services.mercadopago.webhook_secret' => 'secreto']);

        $this->postJson('/webhook/mercadopago', ['type' => 'payment', 'data' => ['id' => '123']])
            ->assertUnauthorized();
    });
});

describe('se conserva el historial al borrar', function () {
    test('borrar un cliente conserva sus citas y pagos', function () {
        $customer = Customer::create([
            'name' => 'Luis',
            'email' => 'luis@citas.test',
            'password' => 'secreto123',
        ]);
        $appointment = makeAppointment(['customer_id' => $customer->id]);
        $payment = Payment::create(['appointment_id' => $appointment->id, 'status' => 'approved', 'amount' => 200]);

        $this->actingAs(userWithRole('admin'))
            ->delete(route('admin.customers.destroy', $customer))
            ->assertRedirect(route('admin.customers.index'));

        expect(Customer::find($customer->id))->toBeNull()
            ->and($appointment->fresh()->customer_id)->toBeNull()
            ->and(Payment::find($payment->id))->not->toBeNull();
    });

    test('no se puede borrar un servicio con citas', function () {
        $appointment = makeAppointment();

        $this->actingAs(userWithRole('admin'))
            ->delete(route('admin.services.destroy', $appointment->service_id))
            ->assertRedirect(route('admin.services.index'));

        expect(Service::find($appointment->service_id))->not->toBeNull()
            ->and($appointment->fresh())->not->toBeNull();
    });

    test('no se puede borrar un empleado con citas', function () {
        $appointment = makeAppointment();

        $this->actingAs(userWithRole('admin'))
            ->delete(route('admin.users.destroy', $appointment->employee_id))
            ->assertRedirect(route('admin.users.index'));

        expect(User::find($appointment->employee_id))->not->toBeNull()
            ->and($appointment->fresh())->not->toBeNull();
    });

    test('la base de datos impide borrar un servicio con citas', function () {
        $appointment = makeAppointment();

        expect(fn () => Service::whereKey($appointment->service_id)->delete())
            ->toThrow(QueryException::class);
    });
});
