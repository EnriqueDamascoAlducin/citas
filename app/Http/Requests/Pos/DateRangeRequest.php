<?php

namespace App\Http\Requests\Pos;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Filtro de fechas de ventas, inventario y reportes.
 */
class DateRangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Cada ruta exige su propio permiso.
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'seller' => ['nullable', 'integer'],
            'product' => ['nullable', 'integer'],
            'type' => ['nullable', 'string', 'max:30'],
            'search' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    public function range(CarbonImmutable $defaultFrom, ?CarbonImmutable $defaultTo = null): array
    {
        $from = $this->validated('from') ? CarbonImmutable::createFromFormat('Y-m-d', $this->validated('from')) : $defaultFrom;
        $to = $this->validated('to') ? CarbonImmutable::createFromFormat('Y-m-d', $this->validated('to')) : ($defaultTo ?? CarbonImmutable::today());

        return [$from->startOfDay(), $to->endOfDay()];
    }
}
