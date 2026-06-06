<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'view-appointments',
            'create-appointments',
            'cancel-appointments',
            'view-any-appointment',
            'manage-services',
            'manage-products',
            'manage-stock',
            'manage-employees',
            'manage-schedule',
            'manage-roles',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $client = Role::findOrCreate('client', 'web');
        $client->givePermissionTo([
            'create-appointments',
            'view-appointments',
            'cancel-appointments',
        ]);

        $employee = Role::findOrCreate('employee', 'web');
        $employee->givePermissionTo([
            'view-appointments',
            'create-appointments',
            'cancel-appointments',
            'manage-schedule',
        ]);

        $admin = Role::findOrCreate('admin', 'web');
        $admin->givePermissionTo([
            'view-any-appointment',
            'view-appointments',
            'create-appointments',
            'cancel-appointments',
            'manage-services',
            'manage-products',
            'manage-stock',
            'manage-employees',
            'manage-schedule',
        ]);

        Role::findOrCreate('super-admin', 'web');

        $adminUser = User::firstOrCreate(
            ['email' => 'admin@citas.com'],
            [
                'name' => 'Admin',
                'password' => bcrypt('admin123'),
            ]
        );
        $adminUser->assignRole('admin');

        $employeeUser = User::firstOrCreate(
            ['email' => 'empleado@citas.com'],
            [
                'name' => 'Empleado Demo',
                'password' => bcrypt('empleado123'),
            ]
        );
        $employeeUser->assignRole('employee');

        $clientUser = User::firstOrCreate(
            ['email' => 'cliente@citas.com'],
            [
                'name' => 'Cliente Demo',
                'password' => bcrypt('cliente123'),
            ]
        );
        $clientUser->assignRole('client');

        $employees = [
            ['name' => 'Carlos Martínez', 'email' => 'carlos@citas.com'],
            ['name' => 'Javier López', 'email' => 'javier@citas.com'],
            ['name' => 'Miguel Ángel Ruiz', 'email' => 'miguel@citas.com'],
        ];

        foreach ($employees as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => bcrypt('empleado123'),
                ]
            );
            $user->assignRole('employee');
        }
    }
}
