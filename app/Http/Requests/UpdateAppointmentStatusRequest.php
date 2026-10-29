<?php

namespace App\Http\Requests;

use App\Enums\AppointmentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppointmentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('updateStatus', $this->route('appointment'));
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(array_map(fn ($s) => $s->value, AppointmentStatus::staffTransitions()))],
        ];
    }
}
