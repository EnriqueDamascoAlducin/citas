<?php

use App\Models\Appointment;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->pomade = Product::create(['name' => 'Pomada', 'price' => 150, 'stock' => 10, 'active' => true]);
    $this->oil = Product::create(['name' => 'Aceite para barba', 'price' => 200, 'stock' => 3, 'active' => true]);
});

function posUser(string $role = 'employee', array $permissions = []): User
{
    $user = User::factory()->create();
    $user->assignRole($role);
    $user->givePermissionTo($permissions);

    return $user;
}

function sell(User $user, array $items, array $extra = [])
{
    return test()->actingAs($user)->post('/pos/ventas', ['items' => $items, 'payment_method' => 'cash', ...$extra]);
}

describe('vender', function () {
    test('un barbero cobra, el stock baja y queda en el historial', function () {
        $barber = posUser();

        sell($barber, [['id' => $this->pomade->id, 'quantity' => 2], ['id' => $this->oil->id, 'quantity' => 1]], ['cash_received' => 600])
            ->assertRedirect(route('pos.sales.show', Sale::sole()));

        $sale = Sale::sole();
        expect((float) $sale->total)->toBe(500.0)
            ->and($sale->user_id)->toBe($barber->id)
            ->and($sale->items)->toHaveCount(2)
            ->and($this->pomade->fresh()->stock)->toBe(8)
            ->and($this->oil->fresh()->stock)->toBe(2);

        $movement = InventoryMovement::where('product_id', $this->pomade->id)->sole();
        expect($movement->quantity)->toBe(-2)
            ->and($movement->stock_after)->toBe(8)
            ->and($movement->reference_id)->toBe($sale->id);
    });

    test('suma el mismo producto repetido y guarda el precio del momento', function () {
        sell(posUser(), [['id' => $this->pomade->id, 'quantity' => 1], ['id' => $this->pomade->id, 'quantity' => 2]]);
        $this->pomade->update(['price' => 999]);

        $item = Sale::sole()->items()->sole();
        expect($item->quantity)->toBe(3)->and((float) $item->unit_price)->toBe(150.0);
    });

    test('no vende más de lo que hay ni deja el stock a medias', function () {
        sell(posUser(), [['id' => $this->pomade->id, 'quantity' => 1], ['id' => $this->oil->id, 'quantity' => 5]])
            ->assertSessionHasErrors('items');

        expect(Sale::count())->toBe(0)
            ->and($this->pomade->fresh()->stock)->toBe(10)
            ->and(InventoryMovement::count())->toBe(0);
    });

    test('rechaza productos inactivos y efectivo que no alcanza', function () {
        $this->oil->update(['active' => false]);
        sell(posUser(), [['id' => $this->oil->id, 'quantity' => 1]])->assertSessionHasErrors('items');

        sell(posUser(), [['id' => $this->pomade->id, 'quantity' => 1]], ['cash_received' => 100])->assertSessionHasErrors('cash_received');

        expect(Sale::count())->toBe(0);
    });

    test('sin el permiso no se entra al punto de venta', function () {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/pos')->assertForbidden();
        sell($user, [['id' => $this->pomade->id, 'quantity' => 1]])->assertForbidden();
    });

    test('la pantalla de cobro solo lista productos activos', function () {
        $this->oil->update(['active' => false]);

        $this->actingAs(posUser())->get('/pos')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('pos/index')->has('products', 1)->where('products.0.name', 'Pomada'));
    });
});

describe('historial de ventas', function () {
    test('el barbero ve solo sus ventas; el admin las de todos', function () {
        $carlos = posUser();
        $javier = posUser();
        sell($carlos, [['id' => $this->pomade->id, 'quantity' => 1]]);
        sell($javier, [['id' => $this->pomade->id, 'quantity' => 1]]);
        $javierSale = Sale::where('user_id', $javier->id)->sole();

        $this->actingAs($carlos)->get('/pos/ventas')
            ->assertInertia(fn (Assert $page) => $page->has('sales.data', 1)->where('seesAll', false));
        $this->actingAs($carlos)->get("/pos/ventas/{$javierSale->id}")->assertForbidden();

        $this->actingAs(posUser('admin'))->get('/pos/ventas')
            ->assertInertia(fn (Assert $page) => $page->has('sales.data', 2)->where('summary.total', 300));
    });
});

describe('cancelar', function () {
    test('el admin cancela y los productos regresan al inventario', function () {
        sell(posUser(), [['id' => $this->oil->id, 'quantity' => 2]]);
        $sale = Sale::sole();
        $admin = posUser('admin');

        $this->actingAs($admin)->post("/pos/ventas/{$sale->id}/cancelar", ['reason' => 'Devolución'])->assertSessionHasNoErrors();

        expect($sale->fresh())
            ->status->toBe('cancelled')
            ->cancelled_by->toBe($admin->id)
            ->cancel_reason->toBe('Devolución')
            ->and($this->oil->fresh()->stock)->toBe(3)
            ->and(InventoryMovement::where('product_id', $this->oil->id)->latest('id')->first()->quantity)->toBe(2);

        $this->actingAs($admin)->post("/pos/ventas/{$sale->id}/cancelar", ['reason' => 'Otra vez'])->assertForbidden();
        expect($this->oil->fresh()->stock)->toBe(3);
    });

    test('un barbero no cancela sin el permiso y el motivo es obligatorio', function () {
        $barber = posUser();
        sell($barber, [['id' => $this->oil->id, 'quantity' => 1]]);
        $sale = Sale::sole();

        $this->actingAs($barber)->post("/pos/ventas/{$sale->id}/cancelar", ['reason' => 'x'])->assertForbidden();
        $this->actingAs(posUser('admin'))->post("/pos/ventas/{$sale->id}/cancelar", ['reason' => ''])->assertSessionHasErrors('reason');

        expect($sale->fresh()->status)->toBe('completed');
    });
});

describe('inventario', function () {
    test('entrada suma piezas y ajuste fija el conteo con motivo', function () {
        $admin = posUser('admin');

        $this->actingAs($admin)->post("/pos/inventario/{$this->oil->id}/movimientos", ['type' => 'restock', 'quantity' => 12, 'note' => 'Proveedor'])->assertSessionHasNoErrors();
        expect($this->oil->fresh()->stock)->toBe(15);

        $this->actingAs($admin)->post("/pos/inventario/{$this->oil->id}/movimientos", ['type' => 'adjustment', 'count' => 13])->assertSessionHasErrors('note');
        $this->actingAs($admin)->post("/pos/inventario/{$this->oil->id}/movimientos", ['type' => 'adjustment', 'count' => 13, 'note' => 'Merma'])->assertSessionHasNoErrors();

        expect($this->oil->fresh()->stock)->toBe(13)
            ->and(InventoryMovement::where('product_id', $this->oil->id)->orderBy('id')->pluck('quantity')->all())->toBe([12, -2]);

        $this->actingAs($admin)->get('/pos/inventario')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('pos/inventory/index')->has('movements.data', 2)->where('summary.low', 0));
    });

    test('un barbero no ve el inventario sin el permiso', function () {
        $this->actingAs(posUser())->get('/pos/inventario')->assertForbidden();
        $this->actingAs(posUser())->post("/pos/inventario/{$this->oil->id}/movimientos", ['type' => 'restock', 'quantity' => 5])->assertForbidden();
    });

    test('cambiar el stock desde Productos queda como ajuste', function () {
        $this->actingAs(posUser('admin'))->put("/admin/products/{$this->oil->id}", [
            'name' => 'Aceite para barba', 'price' => 200, 'stock' => 7, 'active' => true,
        ])->assertSessionHasNoErrors();

        $movement = InventoryMovement::where('product_id', $this->oil->id)->sole();
        expect($movement->quantity)->toBe(4)->and($movement->stock_after)->toBe(7);
    });

    test('cancelar una cita regresa los productos apartados', function () {
        $service = Service::create(['name' => 'Corte', 'description' => 'Corte', 'duration_minutes' => 30, 'price' => 150, 'active' => true]);
        $barber = posUser();
        $appointment = Appointment::create([
            'employee_id' => $barber->id, 'service_id' => $service->id,
            'start_time' => now()->addDay(), 'end_time' => now()->addDay()->addMinutes(30),
            'status' => 'pending', 'total_amount' => 350,
        ]);
        $appointment->products()->attach($this->oil->id, ['quantity' => 2, 'price' => 200]);
        $this->oil->update(['stock' => 1]);

        $appointment->update(['status' => 'cancelled']);

        expect($this->oil->fresh()->stock)->toBe(3)
            ->and(InventoryMovement::where('reference_id', $appointment->id)->sole()->type->value)->toBe('online_cancelled');

        // Una segunda actualización no lo devuelve dos veces.
        $appointment->update(['notes' => 'x']);
        expect($this->oil->fresh()->stock)->toBe(3);
    });
});

describe('reporte de ventas', function () {
    test('suma lo vendido y excluye lo cancelado', function () {
        $barber = posUser();
        sell($barber, [['id' => $this->pomade->id, 'quantity' => 2]]);
        sell($barber, [['id' => $this->oil->id, 'quantity' => 1]], ['payment_method' => 'card']);
        $this->actingAs(posUser('admin'))->post('/pos/ventas/'.Sale::latest('id')->first()->id.'/cancelar', ['reason' => 'Error']);

        $this->actingAs(posUser('admin'))->get('/pos/reportes')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('totals.count', 1)
                ->where('totals.revenue', 300)
                ->where('totals.units', 2)
                ->where('totals.cancelled_count', 1)
                ->where('topProducts.0.name', 'Pomada'));

        $this->actingAs($barber)->get('/pos/reportes')->assertForbidden();
    });
});
