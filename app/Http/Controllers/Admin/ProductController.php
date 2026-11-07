<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\SaleItem;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function store(StoreProductRequest $request, InventoryService $inventory): RedirectResponse
    {
        DB::transaction(function () use ($request, $inventory) {
            $product = Product::create([...$request->safe()->except('stock'), 'stock' => 0]);
            // El stock inicial entra como movimiento para que el historial cuadre.
            $inventory->setCount($product, (int) $request->validated('stock'), $request->user(), 'Alta del producto');
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Producto creado correctamente.']);

        return to_route('admin.products.index');
    }

    public function update(StoreProductRequest $request, Product $product, InventoryService $inventory): RedirectResponse
    {
        DB::transaction(function () use ($request, $product, $inventory) {
            $product = Product::whereKey($product->id)->lockForUpdate()->firstOrFail();
            $product->update($request->safe()->except('stock'));
            $inventory->setCount($product, (int) $request->validated('stock'), $request->user(), 'Editado desde Productos');
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Producto actualizado correctamente.']);

        return to_route('admin.products.index');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        abort_unless($request->user()->can('manage-products'), 403);

        if ($product->appointments()->exists() || SaleItem::where('product_id', $product->id)->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'El producto aparece en citas o ventas registradas. Desactívalo en lugar de eliminarlo.']);

            return to_route('admin.products.index');
        }

        $product->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Producto eliminado correctamente.']);

        return to_route('admin.products.index');
    }
}
