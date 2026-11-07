<?php

namespace App\Http\Controllers\Pos;

use App\Actions\Pos\CancelSale;
use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pos\CancelSaleRequest;
use App\Http\Requests\Pos\DateRangeRequest;
use App\Http\Resources\SaleResource;
use App\Models\Sale;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Historial de ventas de mostrador: las propias, o las de todos con el permiso de reportes.
 */
class SaleController extends Controller
{
    public function index(DateRangeRequest $request): Response
    {
        $user = $request->user();
        $seesAll = $user->can(Permission::ViewSalesReports->value);
        [$from, $to] = $request->range(CarbonImmutable::today());

        $query = Sale::query()
            ->betweenDates($from, $to)
            ->when(! $seesAll, fn ($q) => $q->where('user_id', $user->id))
            ->when($seesAll && $request->validated('seller'), fn ($q, $seller) => $q->where('user_id', $seller));

        $completed = (clone $query)->completed();

        $sales = $query->with(['seller', 'customer', 'items', 'canceller'])->latest()->paginate(20)->withQueryString();

        return Inertia::render('pos/sales/index', [
            'sales' => [
                'data' => SaleResource::collection($sales->items())->resolve(),
                'meta' => static::paginateResponse($sales)['meta'],
            ],
            'summary' => [
                'count' => (clone $completed)->count(),
                'total' => (float) (clone $completed)->sum('total'),
            ],
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'seller' => $request->validated('seller'),
            ],
            'sellers' => $seesAll
                ? User::whereIn('id', Sale::select('user_id')->distinct())->orderBy('name')->get(['id', 'name'])
                : [],
            'seesAll' => $seesAll,
        ]);
    }

    public function show(Sale $sale): Response
    {
        Gate::authorize('view', $sale);

        $sale->load(['seller', 'customer', 'items', 'canceller']);

        return Inertia::render('pos/sales/show', [
            'sale' => (new SaleResource($sale))->resolve(),
        ]);
    }

    public function cancel(CancelSaleRequest $request, Sale $sale, CancelSale $cancelSale): RedirectResponse
    {
        $cancelSale->handle($sale, $request->user(), $request->validated('reason'));

        Inertia::flash('toast', ['type' => 'success', 'message' => "Venta {$sale->folio()} cancelada; los productos regresaron al inventario."]);

        return back();
    }
}
