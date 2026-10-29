<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with(['roles.permissions', 'permissions'])
            ->orderBy('name')
            ->paginate(15)
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name,
                'is_super_admin' => $user->hasRole('super-admin'),
                'role_permissions' => $user->roles->flatMap->permissions->pluck('name')->unique()->values(),
                'direct_permissions' => $user->permissions->pluck('name')->values(),
            ]);

        $roles = Role::where('name', '!=', 'super-admin')->pluck('name');
        $actor = $request->user();

        return Inertia::render('admin/users/index', [
            'users' => static::paginateResponse($users),
            'roles' => $roles,
            'permissionCatalog' => collect(Permission::cases())->map(fn (Permission $p) => [
                'name' => $p->value,
                'label' => $p->label(),
                'group' => $p->group(),
                'grantable' => $actor->can($p->value),
            ]),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
        ]);

        $user->assignRole($data['role']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Usuario creado correctamente.']);

        return to_route('admin.users.index');
    }

    public function update(StoreUserRequest $request, User $user): RedirectResponse
    {
        abort_if($user->hasRole('super-admin') && ! $request->user()->hasRole('super-admin'), 403);

        $data = $request->validated();

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'] ? bcrypt($data['password']) : $user->password,
        ]);

        $user->syncRoles([$data['role']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Usuario actualizado correctamente.']);

        return to_route('admin.users.index');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->can('manage-employees'), 403);
        abort_if($user->hasRole('super-admin') || $user->is($request->user()), 403);

        if ($user->employeeAppointments()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'El usuario tiene citas asignadas como empleado; no se puede eliminar.']);

            return to_route('admin.users.index');
        }

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Usuario eliminado correctamente.']);

        return to_route('admin.users.index');
    }
}
