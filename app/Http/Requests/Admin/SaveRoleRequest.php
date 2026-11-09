<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use App\Support\SystemRoles;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

/**
 * Crear o editar un rol. A un rol del sistema no se le cambia el nombre (si llega, se ignora)
 * y al Administrador y Super admin tampoco los permisos.
 */
class SaveRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! $this->user()->can(Permission::ManageRoles->value)) {
            return false;
        }

        $role = $this->editing();

        return $role === null || ! SystemRoles::isLocked($role->name);
    }

    public function rules(): array
    {
        $role = $this->editing();

        $rules = [
            'permissions' => ['present', 'array'],
            'permissions.*' => [
                'string',
                'distinct',
                Rule::in(Permission::values()),
                // Igual que con los usuarios: nadie reparte un permiso que no tiene.
                // Lo que el rol ya tenía se puede dejar como está.
                function (string $attribute, mixed $value, Closure $fail) use ($role) {
                    if (! $this->user()->can($value) && ! $role?->hasPermissionTo($value)) {
                        $fail('No puedes dar un permiso que tú no tienes.');
                    }
                },
            ],
        ];

        if ($role === null || ! SystemRoles::isSystem($role->name)) {
            $rules['name'] = [
                'required', 'string', 'max:50',
                Rule::notIn(array_keys(SystemRoles::LABELS)),
                Rule::unique('roles', 'name')->where('guard_name', 'web')->ignore($role?->id),
            ];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Escribe el nombre del rol.',
            'name.unique' => 'Ya existe un rol con ese nombre.',
            'name.not_in' => 'Ese nombre está reservado para un rol del sistema.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('name'))) {
            $this->merge(['name' => trim($this->input('name'))]);
        }
    }

    private function editing(): ?Role
    {
        $role = $this->route('role');

        return $role instanceof Role ? $role : null;
    }
}
