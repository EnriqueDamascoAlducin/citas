<?php

namespace App\Http\Controllers\Pos;

use App\Enums\AppointmentStatus;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pos\DateRangeRequest;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Reporte de ventas de productos: mostrador y, aparte, lo vendido en citas en línea.
 */
class SalesReportController extends Controller
{
    public function __invoke(DateRangeRequest $request): Response
    {
        [$from, $to] = $request->range(CarbonImmutable::today()->startOfMonth());

        $completed = Sale::query()->completed()->betweenDates($from, $to);
        $cancelled = Sale::query()->where('status', Sale::STATUS_CANCELLED)->betweenDates($from, $to);

        $count = (clone $completed)->count();
        $revenue = (float) (clone $completed)->sum('total');

        $items = SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.status', Sale::STATUS_COMPLETED)
            ->whereBetween('sales.created_at', [$from, $to]);

        $byDay = (clone $completed)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count, SUM(total) as total')
            ->groupBy('day')
            ->get()
            ->keyBy('day');

        $sellerNames = User::pluck('name', 'id');

        // Productos apartados en citas que ya se atendieron (se cobran junto con la cita).
        $online = DB::table('appointment_product')
            ->join('appointments', 'appointments.id', '=', 'appointment_product.appointment_id')
            ->where('appointments.status', AppointmentStatus::Completed->value)
            ->whereBetween('appointments.start_time', [$from, $to])
            ->selectRaw('COALESCE(SUM(appointment_product.quantity), 0) as units, COALESCE(SUM(appointment_product.quantity * appointment_product.price), 0) as total')
            ->first();

        return Inertia::render('pos/reports/index', [
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'totals' => [
                'count' => $count,
                'revenue' => $revenue,
                'average' => $count ? round($revenue / $count, 2) : 0,
                'units' => (int) (clone $items)->sum('sale_items.quantity'),
                'cancelled_count' => (clone $cancelled)->count(),
                'cancelled_total' => (float) (clone $cancelled)->sum('total'),
                'online_units' => (int) $online->units,
                'online_total' => (float) $online->total,
            ],
            'byDay' => collect(CarbonPeriod::create($from, $to))->map(fn ($day) => [
                'date' => $day->toDateString(),
                'count' => (int) ($byDay[$day->toDateString()]->count ?? 0),
                'total' => (float) ($byDay[$day->toDateString()]->total ?? 0),
            ])->values(),
            'byPaymentMethod' => collect(PaymentMethod::cases())->map(fn (PaymentMethod $method) => [
                'label' => $method->label(),
                'count' => (clone $completed)->where('payment_method', $method->value)->count(),
                'total' => (float) (clone $completed)->where('payment_method', $method->value)->sum('total'),
            ]),
            'topProducts' => (clone $items)
                ->selectRaw('sale_items.product_name as name, SUM(sale_items.quantity) as units, SUM(sale_items.total) as total')
                ->groupBy('sale_items.product_name')
                ->orderByDesc('units')
                ->limit(10)
                ->get()
                ->map(fn ($row) => ['name' => $row->name, 'units' => (int) $row->units, 'total' => (float) $row->total]),
            'bySeller' => (clone $completed)
                ->selectRaw('user_id, COUNT(*) as count, SUM(total) as total')
                ->groupBy('user_id')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($row) => [
                    'name' => $sellerNames[$row->user_id] ?? 'Usuario eliminado',
                    'count' => (int) $row->count,
                    'total' => (float) $row->total,
                ]),
        ]);
    }
}
