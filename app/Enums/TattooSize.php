<?php

namespace App\Enums;

/** Tamaño aproximado que el cliente indica al agendar; el tatuador ajusta en la valoración. */
enum TattooSize: string
{
    case Small = 'small';
    case Medium = 'medium';
    case Large = 'large';
    case ExtraLarge = 'xl';

    public function label(): string
    {
        return match ($this) {
            self::Small => 'Pequeño (hasta 5 cm)',
            self::Medium => 'Mediano (5–15 cm)',
            self::Large => 'Grande (15–30 cm)',
            self::ExtraLarge => 'Muy grande (más de 30 cm)',
        };
    }
}
