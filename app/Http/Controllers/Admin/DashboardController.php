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
        $now = today();
        $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : $now->copy()->startOfMonth();
        $dateTo = $request->date_to ? Carbon::parse($request->date_to) : $now->copy()->endOfMonth();

        $employees = User::role('employee')->orderBy('name')->get(['id', 'name']);

        $query = Appointment::query()
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->employee_id, fn ($q, $id) => $q->where('employee_id', $id))
            ->whereDate('start_time', '>=', $dateFrom)
            ->whereDate('start_time', '<=', $dateTo);

        $rangeAppointments = (clone $query)->count();
        $rangeCompleted = (clone $query)->where('status', 'completed')->count();
        $rangeRevenue = (clone $query)->where('status', 'completed')->sum('total_amount');

        $appointments = (clone $query)
            ->with(['client', 'customer', 'employee', 'service'])
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

        $appointmentsByDay = (clone $query)
            ->selectRaw('DATE(start_time) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['date' => $r->date, 'count' => $r->count]);

        $revenueByDay = (clone $query)
            ->where('status', 'completed')
            ->selectRaw('DATE(start_time) as date, SUM(total_amount) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['date' => $r->date, 'total' => (float) $r->total]);

        $revenueByEmployee = (clone $query)
            ->where('status', 'completed')
            ->selectRaw('employee_id, SUM(total_amount) as total')
            ->groupBy('employee_id')
            ->with('employee:id,name')
            ->get()
            ->map(fn ($r) => ['employee_name' => $r->employee?->name ?? '—', 'total' => (float) $r->total])
            ->sortByDesc('total')
            ->values();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'range_appointments' => $rangeAppointments,
                'range_completed' => $rangeCompleted,
                'range_revenue' => $rangeRevenue,
                'total_products' => Product::sum('stock'),
                'total_users' => User::count(),
            ],
            'appointments' => static::paginateResponse($appointments),
            'appointments_by_day' => $appointmentsByDay,
            'revenue_by_day' => $revenueByDay,
            'revenue_by_employee' => $revenueByEmployee,
            'filters' => [
                'date_from' => $dateFrom->format('Y-m-d'),
                'date_to' => $dateTo->format('Y-m-d'),
                'employee_id' => $request->employee_id ?? '',
                'status' => $request->status ?? '',
            ],
            'employees' => $employees,
        ]);
    }
}
