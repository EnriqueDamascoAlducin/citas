<?php

namespace App\Http\Controllers\Pos;

use App\Enums\InventoryMovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pos\DateRangeRequest;
use App\Http\Requests\Pos\StoreInventoryMovementRequest;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Sale;
use App\Services\InventoryService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Existencias, entradas de mercancía, ajustes por conteo e historial de movimientos.
 */
class InventoryController extends Controller
{
    /** Con estas piezas o menos el producto se marca como «poco stock». */
    public const LOW_STOCK = 5;

    public function index(DateRangeRequest $request): Response
    {
        [$from, $to] = $request->range(CarbonImmutable::today()->subDays(29));
        $search = $request->validated('search');

        $products = Product::query()
            ->with('category')
            ->when($search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderByRaw('active desc')
            ->orderBy('stock')
            ->orderBy('name')
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category' => $p->category?->name,
                'price' => (float) $p->price,
                'stock' => $p->stock,
                'active' => $p->active,
                'level' => match (true) {
                    $p->stock <= 0 => 'out',
                    $p->stock <= self::LOW_STOCK => 'low',
                    default => 'ok',
                },
            ]);

        $movements = InventoryMovement::query()
            ->with(['product:id,name', 'user:id,name', 'reference'])
            ->whereBetween('created_at', [$from, $to])
            ->when($request->validated('product'), fn ($q, $id) => $q->where('product_id', $id))
            ->when($request->validated('type'), fn ($q, $type) => $q->where('type', $type))
            ->latest('id')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('pos/inventory/index', [
            'products' => $products,
            'summary' => [
                'units' => (int) $products->where('active', true)->sum('stock'),
                'value' => round($products->where('active', true)->sum(fn ($p) => $p['stock'] * $p['price']), 2),
                'low' => $products->where('active', true)->where('level', 'low')->count(),
                'out' => $products->where('active', true)->where('level', 'out')->count(),
            ],
            'movements' => [
                'data' => collect($movements->items())->map(fn (InventoryMovement $m) => [
                    'id' => $m->id,
                    'created_at' => $m->created_at->toIso8601String(),
                    'product' => $m->product?->name,
                    'type' => ['value' => $m->type->value, 'label' => $m->type->label()],
                    'quantity' => $m->quantity,
                    'stock_after' => $m->stock_after,
                    'user' => $m->user?->name,
                    'note' => $m->note,
                    'reference' => match (true) {
                        $m->reference instanceof Sale => ['label' => $m->reference->folio(), 'href' => route('pos.sales.show', $m->reference)],
                        $m->reference !== null => ['label' => 'Cita #'.$m->reference_id, 'href' => null],
                        default => null,
                    },
                ]),
                'meta' => static::paginateResponse($movements)['meta'],
            ],
            'types' => InventoryMovementType::options(),
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'product' => $request->validated('product'),
                'type' => $request->validated('type'),
                'search' => $search,
            ],
        ]);
    }

    public function store(StoreInventoryMovementRequest $request, Product $product, InventoryService $inventory): RedirectResponse
    {
        DB::transaction(function () use ($request, $product, $inventory) {
            $product = Product::whereKey($product->id)->lockForUpdate()->firstOrFail();

            if ($request->validated('type') === InventoryMovementType::Restock->value) {
                $inventory->move($product, (int) $request->validated('quantity'), InventoryMovementType::Restock, $request->user(), null, $request->validated('note'));
            } else {
                $inventory->setCount($product, (int) $request->validated('count'), $request->user(), $request->validated('note'));
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => "Inventario de {$product->name} actualizado."]);

        return back();
    }
}
