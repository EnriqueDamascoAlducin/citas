<?php

namespace App\Http\Controllers;

use App\Http\Resources\CustomerAppointmentResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $appointments = $request->user('customer')
            ->appointments()
            ->with(['service', 'employee', 'products', 'payments'])
            ->orderByDesc('start_time')
            ->get();

        return Inertia::render('customer/dashboard', [
            'appointments' => CustomerAppointmentResource::collection($appointments)->resolve(),
            'logoImage' => asset('storage/images/logo.png'),
        ]);
    }
}
