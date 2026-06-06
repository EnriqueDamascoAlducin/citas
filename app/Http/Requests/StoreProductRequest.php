<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage-products');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'category_id' => ['nullable', 'exists:product_categories,id'],
            'active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'price.min' => 'El precio no puede ser negativo.',
            'stock.min' => 'El stock no puede ser negativo.',
        ];
    }
}
