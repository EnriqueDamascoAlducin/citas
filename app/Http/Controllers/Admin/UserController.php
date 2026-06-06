<?php

namespace App\Http\Controllers\Admin;

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
        $users = User::with('roles')
            ->orderBy('name')
            ->paginate(15);

        $roles = Role::where('name', '!=', 'super-admin')->pluck('name');

        return Inertia::render('admin/users/index', [
            'users' => static::paginateResponse($users),
            'roles' => $roles,
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

    public function destroy(User $user): RedirectResponse
    {
        abort_if($user->hasRole('super-admin'), 403);

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Usuario eliminado correctamente.']);

        return to_route('admin.users.index');
    }
}
