<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * El permiso "Administrar roles" ya existía pero nadie lo tenía; ahora abre la pantalla de Roles.
 */
return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::findOrCreate('manage-roles', 'web');
        Role::where('name', 'admin')->where('guard_name', 'web')->first()?->givePermissionTo('manage-roles');

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Role::where('name', 'admin')->where('guard_name', 'web')->first()?->revokePermissionTo('manage-roles');

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
