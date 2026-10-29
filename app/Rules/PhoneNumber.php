<?php

namespace App\Rules;

use App\Support\PhoneNumber as Phone;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Teléfono al que se pueda mandar el WhatsApp de la cita: 10 dígitos (México)
 * o con lada internacional, con +, espacios, guiones o paréntesis.
 */
class PhoneNumber implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! preg_match('/^\+?[\d\s\-()]+$/', $value) || Phone::normalize($value) === null) {
            $fail('Escribe un teléfono válido de 10 dígitos, o con lada internacional.');
        }
    }
}
