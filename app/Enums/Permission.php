<?php

namespace App\Enums;

/**
 * Catálogo de permisos. El valor es el nombre guardado en Spatie.
 */
enum Permission: string
{
    case ViewDashboard = 'view-dashboard';
    case ViewAnyAppointment = 'view-any-appointment';
    case ViewAppointments = 'view-appointments';
    case CreateAppointments = 'create-appointments';
    case CancelAppointments = 'cancel-appointments';
    case ManageSchedule = 'manage-schedule';
    case ManageServices = 'manage-services';
    case ManageProducts = 'manage-products';
    case ManageStock = 'manage-stock';
    case ManageCustomers = 'manage-customers';
    case ManageEmployees = 'manage-employees';
    case ManageRoles = 'manage-roles';
    case ViewBoard = 'view-board';
    case EditCustomers = 'edit-customers';
    case UsePos = 'use-pos';
    case CancelSales = 'cancel-sales';
    case ViewSalesReports = 'view-sales-reports';

    public function label(): string
    {
        return match ($this) {
            self::UsePos => 'Vender en el punto de venta',
            self::CancelSales => 'Cancelar ventas',
            self::ViewSalesReports => 'Ver las ventas de todos y sus reportes',
            self::EditCustomers => 'Editar y eliminar clientes',
            self::ViewBoard => 'Ver el tablero de próximas citas',
            self::ViewDashboard => 'Ver reportes e ingresos',
            self::ViewAnyAppointment => 'Ver las citas de todos',
            self::ViewAppointments => 'Ver su agenda',
            self::CreateAppointments => 'Agendar citas',
            self::CancelAppointments => 'Cancelar citas',
            self::ManageSchedule => 'Editar su horario',
            self::ManageServices => 'Administrar servicios',
            self::ManageProducts => 'Administrar productos',
            self::ManageStock => 'Inventario: entradas, ajustes e historial',
            self::ManageCustomers => 'Ver clientes',
            self::ManageEmployees => 'Administrar usuarios y permisos',
            self::ManageRoles => 'Administrar roles',
        };
    }

    public function group(): string
    {
        return match ($this) {
            self::ViewAppointments, self::ManageSchedule, self::CreateAppointments, self::CancelAppointments => 'Agenda',
            self::ViewDashboard, self::ViewAnyAppointment, self::ViewBoard => 'Reportes',
            self::UsePos, self::CancelSales, self::ViewSalesReports, self::ManageStock => 'Punto de venta',
            self::ManageServices, self::ManageProducts => 'Catálogo',
            self::ManageCustomers, self::EditCustomers, self::ManageEmployees, self::ManageRoles => 'Personas',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
