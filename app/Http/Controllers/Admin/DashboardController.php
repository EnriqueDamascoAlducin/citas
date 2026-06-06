<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $totalAppointments = Appointment::count();
        $todayAppointments = Appointment::whereDate('start_time', today())->count();
        $totalRevenue = Appointment::where('status', 'completed')->sum('total_amount');
        $totalUsers = User::count();
        $totalProducts = Product::sum('stock');

        $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : null;
        $dateTo = $request->date_to ? Carbon::parse($request->date_to) : null;

        $appointments = Appointment::with(['client', 'customer', 'employee', 'service'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->employee_id, fn ($q, $id) => $q->where('employee_id', $id))
            ->when($dateFrom, fn ($q) => $q->whereDate('start_time', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('start_time', '<=', $dateTo))
            ->orderBy('start_time', 'desc')
            ->paginate(15)
            ->through(fn ($apt) => [
                'id' => $apt->id,
                'client_name' => $apt->customer?->name ?? $apt->client?->name ?? '—',
                'employee_name' => $apt->employee?->name,
                'service' => $apt->service?->name,
                'start_time' => $apt->start_time->format('H:i'),
                'date' => $apt->start_time->format('Y-m-d'),
                'status' => $apt->status,
                'total_amount' => $apt->total_amount,
            ]);

        $employees = User::role('employee')->orderBy('name')->get(['id', 'name']);

        $revenueByMonth = Appointment::where('status', 'completed')
            ->selectRaw('SUM(total_amount) as total, YEAR(start_time) as year, MONTH(start_time) as month')
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->limit(6)
            ->get()
            ->map(fn ($r) => ['period' => Carbon::create($r->year, $r->month, 1)->format('M Y'), 'total' => (float) $r->total]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_appointments' => $totalAppointments,
                'today_appointments' => $todayAppointments,
                'total_revenue' => $totalRevenue,
                'total_users' => $totalUsers,
                'total_products' => $totalProducts,
            ],
            'appointments' => static::paginateResponse($appointments),
            'revenue_by_month' => $revenueByMonth,
            'filters' => $request->only(['status', 'employee_id', 'date_from', 'date_to']),
            'employees' => $employees,
        ]);
    }
}
