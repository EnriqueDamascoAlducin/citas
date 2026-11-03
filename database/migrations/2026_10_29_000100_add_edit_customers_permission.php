<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Editar o eliminar un cliente pide su propio permiso, aparte de ver la lista.
 * El admin lo tiene por rol; a otra persona se le da desde Usuarios y permisos.
 */
return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::findOrCreate('edit-customers', 'web');
        Role::where('name', 'admin')->where('guard_name', 'web')->first()?->givePermissionTo('edit-customers');

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::where('name', 'edit-customers')->where('guard_name', 'web')->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
