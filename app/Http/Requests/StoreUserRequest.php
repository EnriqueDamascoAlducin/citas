<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage-employees');
    }

    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($userId)],
            'password' => $userId ? ['nullable', 'string', 'min:8'] : ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'role.exists' => 'El rol seleccionado no es válido.',
        ];
    }
}
