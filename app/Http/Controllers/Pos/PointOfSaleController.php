<?php

namespace App\Http\Controllers\Pos;

use App\Actions\Pos\RecordSale;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pos\StoreSaleRequest;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pantalla de cobro en mostrador.
 */
class PointOfSaleController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('cliente', ''));

        return Inertia::render('pos/index', [
            'products' => Product::query()
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'price', 'stock', 'category_id', 'image'])
                ->map(fn (Product $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'price' => (float) $p->price,
                    'stock' => $p->stock,
                    'category_id' => $p->category_id,
                ]),
            'categories' => ProductCategory::where('active', true)->orderBy('name')->get(['id', 'name']),
            'paymentMethods' => PaymentMethod::options(),
            // Búsqueda de cliente opcional para ligar la venta; se pide con una recarga parcial.
            'customers' => mb_strlen($search) >= 2
                ? Customer::query()
                    ->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', '%'.preg_replace('/\D/', '', $search).'%'))
                    ->orderBy('name')
                    ->limit(8)
                    ->get(['id', 'name', 'phone'])
                : [],
        ]);
    }

    public function store(StoreSaleRequest $request, RecordSale $recordSale): RedirectResponse
    {
        $sale = $recordSale->handle(
            $request->user(),
            $request->validated('items'),
            PaymentMethod::from($request->validated('payment_method')),
            $request->validated('customer_id'),
            $request->filled('cash_received') ? (float) $request->validated('cash_received') : null,
            $request->validated('notes'),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => "Venta {$sale->folio()} registrada."]);

        return to_route('pos.sales.show', $sale);
    }
}
