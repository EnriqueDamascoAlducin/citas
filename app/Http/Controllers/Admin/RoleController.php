<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveRoleRequest;
use App\Support\SystemRoles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        $actor = $request->user();

        $roles = Role::with('permissions')
            ->withCount('users')
            ->where('guard_name', 'web')
            ->where('name', '!=', SystemRoles::SUPER_ADMIN)
            ->get()
            ->sortBy([
                fn (Role $a, Role $b) => SystemRoles::position($a->name) <=> SystemRoles::position($b->name),
                fn (Role $a, Role $b) => strcasecmp($a->name, $b->name),
            ])
            ->values()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => SystemRoles::label($role->name),
                'system' => SystemRoles::isSystem($role->name),
                'locked' => SystemRoles::isLocked($role->name),
                'users_count' => $role->users_count,
                'permissions' => $role->permissions->pluck('name')->values(),
            ]);

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'permissionCatalog' => collect(Permission::cases())->map(fn (Permission $p) => [
                'name' => $p->value,
                'label' => $p->label(),
                'group' => $p->group(),
                'grantable' => $actor->can($p->value),
            ]),
        ]);
    }

    public function store(SaveRoleRequest $request): RedirectResponse
    {
        $role = Role::create(['name' => $request->validated('name'), 'guard_name' => 'web']);
        $role->syncPermissions($request->validated('permissions'));

        Inertia::flash('toast', ['type' => 'success', 'message' => "Rol {$role->name} creado."]);

        return to_route('admin.roles.index');
    }

    public function update(SaveRoleRequest $request, Role $role): RedirectResponse
    {
        // Solo trae nombre cuando el rol se puede renombrar (los del sistema no).
        if ($name = $request->validated('name')) {
            $role->update(['name' => $name]);
        }

        $role->syncPermissions($request->validated('permissions'));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Rol '.SystemRoles::label($role->name).' actualizado.']);

        return to_route('admin.roles.index');
    }

    public function destroy(Request $request, Role $role): RedirectResponse
    {
        abort_unless($request->user()->can(Permission::ManageRoles->value), 403);
        abort_if(SystemRoles::isSystem($role->name), 403);

        if ($role->users()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => "El rol {$role->name} tiene personas asignadas; cámbialas de rol antes de eliminarlo."]);

            return to_route('admin.roles.index');
        }

        $role->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "Rol {$role->name} eliminado."]);

        return to_route('admin.roles.index');
    }
}
