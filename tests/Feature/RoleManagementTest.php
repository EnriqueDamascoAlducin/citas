<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->create()->assignRole('admin');
});

test('el admin ve los roles sin el super admin', function () {
    $this->actingAs($this->admin)->get('/admin/roles')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/roles/index')
            ->has('roles', 3)
            ->where('roles.0.label', 'Administrador')
            ->where('roles.0.locked', true)
            ->where('roles.1.label', 'Tatuador'));
});

test('crea un rol con permisos y se puede asignar a un usuario', function () {
    $this->actingAs($this->admin)->post('/admin/roles', ['name' => '  Cajero ', 'permissions' => ['use-pos', 'manage-stock']])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/admin/roles');

    $role = Role::findByName('Cajero', 'web');
    expect($role->permissions->pluck('name')->sort()->values()->all())->toBe(['manage-stock', 'use-pos']);

    $this->actingAs($this->admin)->post('/admin/users', [
        'name' => 'Luis', 'email' => 'luis@example.com', 'password' => 'secreto123', 'role' => 'Cajero',
    ])->assertSessionHasNoErrors();

    $luis = User::where('email', 'luis@example.com')->sole();
    expect($luis->can('use-pos'))->toBeTrue()
        ->and($luis->can('view-dashboard'))->toBeFalse()
        ->and($luis->homeUrl())->toBe(route('pos.index'));
});

test('editar un rol cambia los permisos de quien lo tiene', function () {
    $role = Role::create(['name' => 'Recepción', 'guard_name' => 'web']);
    $role->givePermissionTo('view-board');
    $user = User::factory()->create()->assignRole('Recepción');

    $this->actingAs($this->admin)->put("/admin/roles/{$role->id}", ['name' => 'Recepcionista', 'permissions' => ['view-board', 'manage-customers']])
        ->assertSessionHasNoErrors();

    expect($role->fresh()->name)->toBe('Recepcionista')
        ->and($user->fresh()->can('manage-customers'))->toBeTrue();
});

test('el rol Barbero cambia permisos pero no nombre', function () {
    $employee = Role::findByName('employee', 'web');

    $this->actingAs($this->admin)->put("/admin/roles/{$employee->id}", ['name' => 'Estilista', 'permissions' => ['view-appointments', 'manage-schedule', 'use-pos', 'manage-stock']])
        ->assertSessionHasNoErrors();

    expect($employee->fresh()->name)->toBe('employee')
        ->and($employee->fresh()->hasPermissionTo('manage-stock'))->toBeTrue();
});

test('no se tocan los permisos del Administrador ni del Super admin', function () {
    foreach (['admin', 'super-admin'] as $name) {
        $role = Role::findByName($name, 'web');
        $this->actingAs($this->admin)->put("/admin/roles/{$role->id}", ['permissions' => []])->assertForbidden();
    }

    expect($this->admin->fresh()->can('manage-roles'))->toBeTrue();
});

test('no se usan nombres repetidos ni reservados', function () {
    Role::create(['name' => 'Cajero', 'guard_name' => 'web']);

    $this->actingAs($this->admin)->post('/admin/roles', ['name' => 'Cajero', 'permissions' => []])->assertSessionHasErrors('name');
    $this->actingAs($this->admin)->post('/admin/roles', ['name' => 'admin', 'permissions' => []])->assertSessionHasErrors('name');
    $this->actingAs($this->admin)->post('/admin/roles', ['name' => '', 'permissions' => []])->assertSessionHasErrors('name');
});

test('no se da un permiso que uno no tiene', function () {
    $manager = User::factory()->create()->givePermissionTo(['manage-roles', 'use-pos']);

    $this->actingAs($manager)->post('/admin/roles', ['name' => 'Cajero', 'permissions' => ['use-pos', 'view-dashboard']])
        ->assertSessionHasErrors('permissions.1');

    expect(Role::where('name', 'Cajero')->exists())->toBeFalse();
});

test('se elimina un rol vacío; uno con personas o del sistema no', function () {
    $empty = Role::create(['name' => 'Temporal', 'guard_name' => 'web']);
    $busy = Role::create(['name' => 'Cajero', 'guard_name' => 'web']);
    User::factory()->create()->assignRole('Cajero');

    $this->actingAs($this->admin)->delete("/admin/roles/{$empty->id}")->assertRedirect('/admin/roles');
    $this->actingAs($this->admin)->delete("/admin/roles/{$busy->id}")->assertRedirect('/admin/roles');
    $this->actingAs($this->admin)->delete('/admin/roles/'.Role::findByName('employee', 'web')->id)->assertForbidden();

    expect(Role::where('name', 'Temporal')->exists())->toBeFalse()
        ->and(Role::where('name', 'Cajero')->exists())->toBeTrue()
        ->and(Role::where('name', 'employee')->exists())->toBeTrue();
});

test('sin el permiso no se entra a Roles', function () {
    $barber = User::factory()->create()->assignRole('employee');

    $this->actingAs($barber)->get('/admin/roles')->assertForbidden();
    $this->actingAs($barber)->post('/admin/roles', ['name' => 'X', 'permissions' => []])->assertForbidden();
});
