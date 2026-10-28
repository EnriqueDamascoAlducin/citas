<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductCategoryRequest;
use App\Models\ProductCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductCategoryController extends Controller
{
    public function store(StoreProductCategoryRequest $request): RedirectResponse
    {
        ProductCategory::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Categoría creada correctamente.']);

        return to_route('admin.products.index');
    }

    public function destroy(Request $request, ProductCategory $category): RedirectResponse
    {
        abort_unless($request->user()->can('manage-products'), 403);

        $category->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Categoría eliminada.']);

        return to_route('admin.products.index');
    }
}
