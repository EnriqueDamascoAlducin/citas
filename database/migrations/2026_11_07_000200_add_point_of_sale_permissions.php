<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Permisos del punto de venta. Los barberos venden por rol; cancelar ventas y
 * ver reportes es del admin, y se puede sumar a otra persona desde Permisos.
 */
return new class extends Migration
{
    private const NEW_PERMISSIONS = ['use-pos', 'cancel-sales', 'view-sales-reports'];

    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::NEW_PERMISSIONS as $name) {
            Permission::findOrCreate($name, 'web');
        }

        Role::where('name', 'admin')->where('guard_name', 'web')->first()?->givePermissionTo(self::NEW_PERMISSIONS);
        Role::where('name', 'employee')->where('guard_name', 'web')->first()?->givePermissionTo('use-pos');

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::whereIn('name', self::NEW_PERMISSIONS)->where('guard_name', 'web')->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
