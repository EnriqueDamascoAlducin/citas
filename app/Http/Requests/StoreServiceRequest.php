<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage-services');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'price' => ['required', 'numeric', 'min:0'],
            'active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'duration_minutes.min' => 'La duración mínima es 5 minutos.',
            'duration_minutes.max' => 'La duración máxima es 480 minutos.',
            'price.min' => 'El precio no puede ser negativo.',
        ];
    }
}
