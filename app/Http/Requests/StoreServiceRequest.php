<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage-services');
    }

    /** Sin anticipo = 0 (la columna no acepta null). */
    protected function prepareForValidation(): void
    {
        if (blank($this->input('deposit_amount'))) {
            $this->merge(['deposit_amount' => 0]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'price' => ['required', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0', 'lte:price'],
            'active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'duration_minutes.min' => 'La duración mínima es 5 minutos.',
            'duration_minutes.max' => 'La duración máxima es 480 minutos.',
            'price.min' => 'El precio no puede ser negativo.',
            'deposit_amount.lte' => 'El anticipo no puede ser mayor que el precio.',
        ];
    }
}
