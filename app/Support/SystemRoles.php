<?php

namespace App\Support;

/**
 * Roles de los que depende el sistema. Los roles que crea el negocio se guardan con su nombre tal cual
 * ("Recepción", "Cajero"); estos llevan una clave técnica y una etiqueta para mostrar.
 */
final class SystemRoles
{
    public const SUPER_ADMIN = 'super-admin';

    public const ADMIN = 'admin';

    /** Quien tiene este rol aparece como tatuador en la reserva en línea. */
    public const EMPLOYEE = 'employee';

    public const CLIENT = 'client';

    public const LABELS = [
        self::ADMIN => 'Administrador',
        self::EMPLOYEE => 'Tatuador',
        self::CLIENT => 'Cliente',
        self::SUPER_ADMIN => 'Super admin',
    ];

    /** No se pueden renombrar ni eliminar. */
    public static function isSystem(string $name): bool
    {
        return array_key_exists($name, self::LABELS);
    }

    /**
     * Tampoco se les cambian los permisos: el admin podría quitarse el acceso a sí mismo
     * y el super admin no usa permisos (lo puede todo).
     */
    public static function isLocked(string $name): bool
    {
        return in_array($name, [self::SUPER_ADMIN, self::ADMIN], true);
    }

    public static function label(string $name): string
    {
        return self::LABELS[$name] ?? $name;
    }

    /** Para ordenar: primero los del sistema en este orden y luego los creados. */
    public static function position(string $name): int
    {
        $index = array_search($name, array_keys(self::LABELS), true);

        return $index === false ? 99 : $index;
    }
}
