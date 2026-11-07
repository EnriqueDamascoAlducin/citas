<?php

namespace App\Http\Requests\Pos;

use Illuminate\Foundation\Http\FormRequest;

class SendSaleTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('view', $this->route('sale'));
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Escribe el correo al que se enviará el ticket.',
            'email.email' => 'Escribe un correo válido.',
        ];
    }
}
