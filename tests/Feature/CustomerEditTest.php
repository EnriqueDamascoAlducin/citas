<?php

use App\Models\Customer;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->customer = Customer::create(['name' => 'Ana López', 'email' => 'ana@example.com', 'phone' => '+525512345678', 'password' => 'password']);
});

function customerEditor(array $permissions = [], string $role = 'employee'): User
{
    $user = User::factory()->create();
    $user->assignRole($role);
    $user->givePermissionTo($permissions);

    return $user;
}

function customerPayload(array $overrides = []): array
{
    return ['name' => 'Ana María López', 'email' => 'ana.maria@example.com', 'phone' => '55 9876 5432', 'password' => '', ...$overrides];
}

test('el admin edita los datos del cliente', function () {
    $this->actingAs(customerEditor(role: 'admin'))
        ->put("/admin/customers/{$this->customer->id}", customerPayload())
        ->assertSessionHasNoErrors();

    expect($this->customer->fresh())
        ->name->toBe('Ana María López')
        ->email->toBe('ana.maria@example.com')
        ->phone->toBe('+525598765432');
});

test('sin contraseña nueva se conserva la anterior; con una, se cambia', function () {
    $admin = customerEditor(role: 'admin');

    $this->actingAs($admin)->put("/admin/customers/{$this->customer->id}", customerPayload());
    expect(Hash::check('password', $this->customer->fresh()->password))->toBeTrue();

    $this->actingAs($admin)->put("/admin/customers/{$this->customer->id}", customerPayload(['password' => 'nueva-clave-123']));
    expect(Hash::check('nueva-clave-123', $this->customer->fresh()->password))->toBeTrue();
});

test('quien solo puede ver clientes no los edita ni los elimina', function () {
    $viewer = customerEditor(['manage-customers']);

    $this->actingAs($viewer)->get('/admin/customers')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('canEdit', false));

    $this->actingAs($viewer)->put("/admin/customers/{$this->customer->id}", customerPayload())->assertForbidden();
    $this->actingAs($viewer)->delete("/admin/customers/{$this->customer->id}")->assertForbidden();

    expect($this->customer->fresh()->name)->toBe('Ana López');
});

test('con el permiso extra un barbero puede editar', function () {
    $editor = customerEditor(['manage-customers', 'edit-customers']);

    $this->actingAs($editor)->get('/admin/customers')
        ->assertInertia(fn (Assert $page) => $page->where('canEdit', true));

    $this->actingAs($editor)->put("/admin/customers/{$this->customer->id}", customerPayload())->assertSessionHasNoErrors();

    expect($this->customer->fresh()->name)->toBe('Ana María López');
});

test('valida el teléfono y que el correo no sea de otro cliente', function () {
    Customer::create(['name' => 'Luis', 'email' => 'luis@example.com', 'phone' => '+525511112222', 'password' => 'password']);

    $this->actingAs(customerEditor(role: 'admin'))
        ->put("/admin/customers/{$this->customer->id}", customerPayload(['email' => 'luis@example.com', 'phone' => '123']))
        ->assertSessionHasErrors(['email', 'phone']);
});

test('eliminar ya no depende del permiso de usuarios del equipo', function () {
    $this->actingAs(customerEditor(['manage-customers', 'edit-customers']))
        ->delete("/admin/customers/{$this->customer->id}")
        ->assertRedirect('/admin/customers');

    expect(Customer::find($this->customer->id))->toBeNull();
});
