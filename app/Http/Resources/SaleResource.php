<?php

namespace App\Http\Resources;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Sale
 */
class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cash = $this->cash_received !== null ? (float) $this->cash_received : null;

        return [
            'id' => $this->id,
            'folio' => $this->folio(),
            'created_at' => $this->created_at->toIso8601String(),
            'seller' => $this->seller?->name,
            'customer' => $this->customer?->name,
            'payment_method' => ['value' => $this->payment_method->value, 'label' => $this->payment_method->label()],
            'total' => (float) $this->total,
            'cash_received' => $cash,
            'change' => $cash !== null ? round($cash - (float) $this->total, 2) : null,
            'status' => $this->status,
            'notes' => $this->notes,
            'items_count' => $this->whenLoaded('items', fn () => (int) $this->items->sum('quantity')),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'name' => $item->product_name,
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'total' => (float) $item->total,
            ])),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancelled_by' => $this->canceller?->name,
            'cancel_reason' => $this->cancel_reason,
            'can_cancel' => $request->user()?->can('cancel', $this->resource) ?? false,
        ];
    }
}
