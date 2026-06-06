<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::query()
            ->with('category')
            ->when($request->search, fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->category, fn ($q, $category) => $q->where('category_id', $category))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        $categories = ProductCategory::where('active', true)->orderBy('name')->get();

        return Inertia::render('admin/products/index', [
            'products' => static::paginateResponse($products),
            'categories' => ProductCategory::where('active', true)->orderBy('name')->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        Product::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Producto creado correctamente.']);

        return to_route('admin.products.index');
    }

    public function update(StoreProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Producto actualizado correctamente.']);

        return to_route('admin.products.index');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Producto eliminado correctamente.']);

        return to_route('admin.products.index');
    }
}
