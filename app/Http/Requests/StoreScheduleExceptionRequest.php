<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleExceptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage-schedule');
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'available' => ['boolean'],
            'reason' => ['nullable', 'string', 'max:500'],
            'employee_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'date.after_or_equal' => 'La fecha debe ser hoy o posterior.',
        ];
    }
}
