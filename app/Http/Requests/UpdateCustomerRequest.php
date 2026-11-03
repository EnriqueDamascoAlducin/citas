<?php

namespace App\Http\Requests;

use App\Rules\PhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('customer'));
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('customers')->ignore($this->route('customer'))],
            'phone' => ['required', 'string', 'max:20', new PhoneNumber],
            // Opcional: para ayudar a un cliente que olvidó su contraseña.
            'password' => ['nullable', 'string', Password::defaults()],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Ya hay otro cliente con ese correo.',
            'phone.required' => 'El teléfono es obligatorio: ahí le llegan la confirmación y el recordatorio.',
        ];
    }
}
