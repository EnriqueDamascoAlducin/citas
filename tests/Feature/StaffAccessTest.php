<?php

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->service = Service::create([
        'name' => 'Corte',
        'description' => 'Corte clásico',
        'duration_minutes' => 30,
        'price' => 200,
        'active' => true,
    ]);
});

function staff(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function appointmentFor(User $employee, array $overrides = []): Appointment
{
    return Appointment::create([
        'employee_id' => $employee->id,
        'service_id' => test()->service->id,
        'start_time' => today()->setTime(10, 0),
        'end_time' => today()->setTime(10, 30),
        'status' => 'pending',
        'total_amount' => 200,
        ...$overrides,
    ]);
}

describe('aterrizaje al iniciar sesión', function () {
    test('cada rol entra a su sección', function (string $role, string $route) {
        $user = staff($role);

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect(route($route));
    })->with([
        'admin' => ['admin', 'admin.dashboard'],
        'barbero' => ['employee', 'professional.agenda'],
        'cliente' => ['client', 'home'],
    ]);

    test('el registro público de personal está desactivado', function () {
        $this->get('/register')->assertNotFound();
    });
});

describe('permisos por sección', function () {
    test('un barbero ve su agenda pero no el admin', function () {
        $this->actingAs(staff('employee'));

        $this->get(route('professional.agenda'))->assertOk();
        $this->get(route('employee.schedule.index'))->assertOk();
        $this->get(route('admin.dashboard'))->assertForbidden();
        $this->get(route('admin.services.index'))->assertForbidden();
        $this->get(route('admin.users.index'))->assertForbidden();
    });

    test('un permiso directo abre solo esa sección', function () {
        $barber = staff('employee');
        $barber->givePermissionTo('manage-services');

        $this->actingAs($barber);

        $this->get(route('admin.services.index'))->assertOk();
        $this->get(route('admin.products.index'))->assertForbidden();
    });
});

describe('gestión de permisos por usuario', function () {
    test('un admin otorga y quita permisos directos', function () {
        $barber = staff('employee');
        $this->actingAs(staff('admin'));

        $this->put(route('admin.users.permissions.update', $barber), ['permissions' => ['manage-products']])
            ->assertSessionHasNoErrors();
        expect($barber->fresh()->getDirectPermissions()->pluck('name')->all())->toBe(['manage-products']);

        $this->put(route('admin.users.permissions.update', $barber), ['permissions' => []])
            ->assertSessionHasNoErrors();
        expect($barber->fresh()->getDirectPermissions())->toBeEmpty();
    });

    test('nadie otorga un permiso que no tiene', function () {
        $barber = staff('employee');

        $this->actingAs(staff('admin'))
            ->put(route('admin.users.permissions.update', $barber), ['permissions' => ['manage-roles']])
            ->assertSessionHasErrors('permissions.0');

        expect($barber->fresh()->getDirectPermissions())->toBeEmpty();
    });

    test('un admin no toca los permisos de un super-admin', function () {
        $this->actingAs(staff('admin'))
            ->put(route('admin.users.permissions.update', staff('super-admin')), ['permissions' => []])
            ->assertForbidden();
    });

    test('un barbero no puede cambiar permisos', function () {
        $other = staff('employee');

        $this->actingAs(staff('employee'))
            ->put(route('admin.users.permissions.update', $other), ['permissions' => []])
            ->assertForbidden();
    });

    test('la lista de usuarios separa permisos del rol y directos', function () {
        $barber = staff('employee');
        $barber->givePermissionTo('manage-products');

        $this->actingAs(staff('admin'))
            ->get(route('admin.users.index'))
            ->assertInertia(fn ($page) => $page
                ->component('admin/users/index')
                ->where('users.data', fn ($users) => collect($users)->contains(fn ($u) => $u['id'] === $barber->id
                    && in_array('view-appointments', $u['role_permissions'], true)
                    && $u['direct_permissions'] === ['manage-products']))
                ->has('permissionCatalog'));
    });
});

describe('agenda del profesional', function () {
    test('muestra solo las citas propias del día', function () {
        $barber = staff('employee');
        appointmentFor($barber);
        appointmentFor(staff('employee'));
        appointmentFor($barber, ['start_time' => today()->addDay()->setTime(10, 0), 'end_time' => today()->addDay()->setTime(10, 30)]);

        $this->actingAs($barber)
            ->get(route('professional.agenda'))
            ->assertInertia(fn ($page) => $page
                ->component('professional/agenda')
                ->has('appointments', 1)
                ->where('summary.total', 1)
                ->has('week', 7));
    });

    test('el barbero cambia el estado de sus citas y no el de otros', function () {
        $barber = staff('employee');
        $own = appointmentFor($barber);
        $foreign = appointmentFor(staff('employee'));

        $this->actingAs($barber);

        $this->patch(route('employee.appointments.update-status', $own), ['status' => 'no_show'])->assertRedirect();
        $this->patch(route('employee.appointments.update-status', $foreign), ['status' => 'completed'])->assertForbidden();

        expect($own->fresh()->status)->toBe('no_show')
            ->and($foreign->fresh()->status)->toBe('pending');
    });

    test('rechaza estados que no existen', function () {
        $barber = staff('employee');

        $this->actingAs($barber)
            ->patch(route('employee.appointments.update-status', appointmentFor($barber)), ['status' => 'borrada'])
            ->assertSessionHasErrors('status');
    });
});

test('el cliente ve sus citas con productos y estado de pago', function () {
    $customer = Customer::create(['name' => 'Ana', 'email' => 'ana@citas.test', 'password' => 'secreto123']);
    $other = Customer::create(['name' => 'Beto', 'email' => 'beto@citas.test', 'password' => 'secreto123']);
    $product = Product::create(['name' => 'Cera', 'price' => 100, 'stock' => 5, 'active' => true]);

    $appointment = appointmentFor(staff('employee'), ['customer_id' => $customer->id]);
    $appointment->products()->attach($product->id, ['quantity' => 2, 'price' => 100]);
    $appointment->payments()->create(['status' => 'approved', 'amount' => 400]);
    appointmentFor(staff('employee'), ['customer_id' => $other->id]);

    $this->actingAs($customer, 'customer')
        ->get(route('customer.dashboard'))
        ->assertInertia(fn ($page) => $page
            ->has('appointments', 1)
            ->where('appointments.0.products.0', ['name' => 'Cera', 'quantity' => 2])
            ->where('appointments.0.is_paid', true));
});
