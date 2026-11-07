<?php

namespace App\Http\Requests\Pos;

use App\Enums\InventoryMovementType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Entrada de mercancía (suma piezas) o ajuste por conteo físico (fija el stock).
 */
class StoreInventoryMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        // El permiso de inventario ya lo exige la ruta.
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in([InventoryMovementType::Restock->value, InventoryMovementType::Adjustment->value])],
            'quantity' => ['required_if:type,restock', 'nullable', 'integer', 'min:1', 'max:100000'],
            'count' => ['required_if:type,adjustment', 'nullable', 'integer', 'min:0', 'max:100000'],
            'note' => ['required_if:type,adjustment', 'nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'quantity.required_if' => 'Indica cuántas piezas entraron.',
            'count.required_if' => 'Indica cuántas piezas contaste.',
            'note.required_if' => 'Escribe el motivo del ajuste (merma, conteo, producto dañado…).',
        ];
    }
}
