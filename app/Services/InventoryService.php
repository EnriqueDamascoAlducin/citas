<?php

namespace App\Services;

use App\Enums\InventoryMovementType;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Único lugar que cambia el stock: cada cambio deja su movimiento en el
 * historial. Quien lo llama abre la transacción y bloquea el producto
 * (lockForUpdate) para que dos ventas simultáneas no lean el mismo stock.
 */
class InventoryService
{
    public function move(
        Product $product,
        int $quantity,
        InventoryMovementType $type,
        ?User $user = null,
        ?Model $reference = null,
        ?string $note = null,
    ): InventoryMovement {
        $product->stock += $quantity;
        $product->save();

        return $product->inventoryMovements()->create([
            'user_id' => $user?->id,
            'type' => $type,
            'quantity' => $quantity,
            'stock_after' => $product->stock,
            'reference_type' => $reference?->getMorphClass(),
            'reference_id' => $reference?->getKey(),
            'note' => $note,
        ]);
    }

    /** Lleva el stock a un conteo físico; no crea movimiento si no cambia. */
    public function setCount(Product $product, int $count, ?User $user, ?string $note = null): ?InventoryMovement
    {
        $difference = $count - $product->stock;

        return $difference === 0
            ? null
            : $this->move($product, $difference, InventoryMovementType::Adjustment, $user, null, $note);
    }
}
