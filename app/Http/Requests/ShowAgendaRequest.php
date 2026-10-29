<?php

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

class ShowAgendaRequest extends FormRequest
{
    public function authorize(): bool
    {
        // El permiso ya lo exige la ruta; aquí no hay más reglas.
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    public function agendaDate(): CarbonImmutable
    {
        return $this->validated('date')
            ? CarbonImmutable::createFromFormat('Y-m-d', $this->validated('date'))->startOfDay()
            : CarbonImmutable::today();
    }
}
