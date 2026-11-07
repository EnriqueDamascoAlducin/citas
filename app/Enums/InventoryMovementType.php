<?php

namespace App\Enums;

/**
 * Por qué cambió el stock de un producto.
 */
enum InventoryMovementType: string
{
    case Restock = 'restock';
    case Adjustment = 'adjustment';
    case Sale = 'sale';
    case SaleCancelled = 'sale_cancelled';
    case OnlineOrder = 'online_order';
    case OnlineCancelled = 'online_cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Restock => 'Entrada',
            self::Adjustment => 'Ajuste',
            self::Sale => 'Venta en mostrador',
            self::SaleCancelled => 'Venta cancelada',
            self::OnlineOrder => 'Apartado en cita',
            self::OnlineCancelled => 'Cita cancelada',
        };
    }

    /** @return list<array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(fn (self $t) => ['value' => $t->value, 'label' => $t->label()], self::cases());
    }
}
