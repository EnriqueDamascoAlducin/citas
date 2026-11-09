<?php

namespace App\Http\Requests;

use App\Enums\TattooSize;
use App\Rules\PhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'exists:services,id'],
            'employee_id' => ['required', 'exists:users,id'],
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            // Se ignora: el fin se calcula con la duración del servicio.
            'end_time' => ['nullable', 'date_format:H:i'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'body_zone' => ['nullable', 'string', 'max:50'],
            'tattoo_size' => ['nullable', Rule::enum(TattooSize::class)],
            'reference_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            // No tatuamos a menores: quien agenda confirma que es mayor de edad.
            'age_confirmed' => ['accepted'],
            'products' => ['nullable', 'array'],
            'products.*.id' => ['required_with:products', 'exists:products,id'],
            'products.*.quantity' => ['required_with:products', 'integer', 'min:1'],
            // La confirmación se manda por teléfono; solo se pide si el cliente aún no tiene uno.
            'phone' => [
                Rule::requiredIf(fn () => $this->user('customer') && blank($this->user('customer')->phone)),
                'nullable',
                'string',
                'max:20',
                new PhoneNumber,
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'Agrega tu teléfono para enviarte la confirmación de la cita.',
            'age_confirmed.accepted' => 'Confirma que eres mayor de 18 años.',
            'reference_image.image' => 'La referencia debe ser una imagen.',
            'reference_image.max' => 'La imagen de referencia no puede pesar más de 5 MB.',
        ];
    }
}
