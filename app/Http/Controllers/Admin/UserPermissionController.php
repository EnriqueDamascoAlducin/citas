<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserPermissionsRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class UserPermissionController extends Controller
{
    /**
     * Sincroniza los permisos asignados directamente al usuario (los del rol no se tocan).
     */
    public function update(UpdateUserPermissionsRequest $request, User $user): RedirectResponse
    {
        $user->syncPermissions($request->validated('permissions'));

        Inertia::flash('toast', ['type' => 'success', 'message' => "Permisos de {$user->name} actualizados."]);

        return back();
    }
}
