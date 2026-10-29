<?php

namespace App\Http\Requests;

use App\Enums\Permission;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserPermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $actor = $this->user();
        $target = $this->route('user');

        if (! $actor->can(Permission::ManageEmployees->value)) {
            return false;
        }

        return ! $target->hasRole('super-admin') || $actor->hasRole('super-admin');
    }

    public function rules(): array
    {
        return [
            'permissions' => ['present', 'array'],
            'permissions.*' => [
                'string',
                'distinct',
                Rule::in(Permission::values()),
                // Nadie puede otorgar un permiso que no tiene.
                function (string $attribute, mixed $value, Closure $fail) {
                    if (! $this->user()->can($value)) {
                        $fail('No puedes otorgar un permiso que tú no tienes.');
                    }
                },
            ],
        ];
    }
}
