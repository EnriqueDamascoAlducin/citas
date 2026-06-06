<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'exists:services,id'],
            'employee_id' => ['required', 'exists:users,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'products' => ['nullable', 'array'],
            'products.*.id' => ['required_with:products', 'exists:products,id'],
            'products.*.quantity' => ['required_with:products', 'integer', 'min:1'],
        ];
    }
}
