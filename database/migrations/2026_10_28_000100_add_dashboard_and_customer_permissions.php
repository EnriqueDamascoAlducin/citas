<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Permisos nuevos para separar reportes y clientes del resto del admin.
 */
return new class extends Migration
{
    private const NEW_PERMISSIONS = ['view-dashboard', 'manage-customers'];

    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::NEW_PERMISSIONS as $name) {
            Permission::findOrCreate($name, 'web');
        }

        Role::where('name', 'admin')->where('guard_name', 'web')->first()?->givePermissionTo(self::NEW_PERMISSIONS);

        // "view-appointments" ahora abre la agenda del barbero; el cliente no lo necesita.
        Role::where('name', 'client')->where('guard_name', 'web')->first()?->revokePermissionTo('view-appointments');

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Role::where('name', 'client')->where('guard_name', 'web')->first()?->givePermissionTo('view-appointments');

        Permission::whereIn('name', self::NEW_PERMISSIONS)->where('guard_name', 'web')->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
