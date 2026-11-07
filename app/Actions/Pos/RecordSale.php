<?php

namespace App\Actions\Pos;

use App\Enums\InventoryMovementType;
use App\Enums\PaymentMethod;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Cobra una venta de mostrador: valida stock con los productos bloqueados,
 * guarda la venta con el precio del momento y descuenta el inventario.
 */
class RecordSale
{
    public function __construct(private InventoryService $inventory) {}

    /**
     * @param  array<int, array{id: int, quantity: int}>  $items
     */
    public function handle(
        User $seller,
        array $items,
        PaymentMethod $paymentMethod,
        ?int $customerId = null,
        ?float $cashReceived = null,
        ?string $notes = null,
    ): Sale {
        // Suma cantidades si el mismo producto viene repetido.
        $quantities = collect($items)->groupBy('id')->map(fn ($rows) => (int) $rows->sum('quantity'));

        return DB::transaction(function () use ($seller, $quantities, $paymentMethod, $customerId, $cashReceived, $notes) {
            $products = Product::whereIn('id', $quantities->keys())->lockForUpdate()->get()->keyBy('id');
            $total = 0.0;

            foreach ($quantities as $id => $quantity) {
                $product = $products->get($id);

                if (! $product || ! $product->active) {
                    throw ValidationException::withMessages(['items' => 'Un producto del ticket ya no está disponible.']);
                }

                if ($product->stock < $quantity) {
                    throw ValidationException::withMessages(['items' => "Solo quedan {$product->stock} de {$product->name}."]);
                }

                $total += (float) $product->price * $quantity;
            }

            if ($paymentMethod === PaymentMethod::Cash && $cashReceived !== null && $cashReceived < $total) {
                throw ValidationException::withMessages(['cash_received' => 'El efectivo recibido no cubre el total.']);
            }

            $sale = Sale::create([
                'user_id' => $seller->id,
                'customer_id' => $customerId,
                'payment_method' => $paymentMethod,
                'total' => $total,
                'cash_received' => $paymentMethod === PaymentMethod::Cash ? $cashReceived : null,
                'status' => Sale::STATUS_COMPLETED,
                'notes' => $notes,
            ]);

            foreach ($quantities as $id => $quantity) {
                $product = $products->get($id);

                $sale->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $quantity,
                    'unit_price' => $product->price,
                    'total' => (float) $product->price * $quantity,
                ]);

                $this->inventory->move($product, -$quantity, InventoryMovementType::Sale, $seller, $sale);
            }

            return $sale;
        });
    }
}
