<?php

namespace App\Actions\Pos;

use App\Enums\InventoryMovementType;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Cancela una venta y regresa sus productos al inventario. La venta no se
 * borra: queda marcada con quién la canceló y por qué.
 */
class CancelSale
{
    public function __construct(private InventoryService $inventory) {}

    public function handle(Sale $sale, User $user, string $reason): Sale
    {
        return DB::transaction(function () use ($sale, $user, $reason) {
            $sale = Sale::whereKey($sale->id)->lockForUpdate()->firstOrFail();

            if ($sale->isCancelled()) {
                throw ValidationException::withMessages(['reason' => 'Esta venta ya estaba cancelada.']);
            }

            $items = $sale->items()->whereNotNull('product_id')->get();
            $products = Product::whereIn('id', $items->pluck('product_id'))->lockForUpdate()->get()->keyBy('id');

            foreach ($items as $item) {
                $this->inventory->move(
                    $products[$item->product_id],
                    $item->quantity,
                    InventoryMovementType::SaleCancelled,
                    $user,
                    $sale,
                    $reason,
                );
            }

            $sale->update([
                'status' => Sale::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancelled_by' => $user->id,
                'cancel_reason' => $reason,
            ]);

            return $sale;
        });
    }
}
