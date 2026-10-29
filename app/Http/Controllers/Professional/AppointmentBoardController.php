<?php

namespace App\Http\Controllers\Professional;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BoardAppointmentResource;
use App\Models\Appointment;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tablero tipo aeropuerto con las próximas citas del día, para la TV de
 * recepción. Solo lectura; la página se recarga sola.
 */
class AppointmentBoardController extends Controller
{
    /** Cuántas citas se mandan; la página rota por páginas si no caben. */
    private const LIMIT = 40;

    public function __invoke(): Response
    {
        $appointments = Appointment::query()
            ->whereIn('status', [AppointmentStatus::Pending->value, AppointmentStatus::Confirmed->value])
            ->where('end_time', '>=', now())
            ->where('start_time', '<=', now()->endOfDay())
            ->with(['customer', 'client', 'service', 'employee'])
            ->orderBy('start_time')
            ->limit(self::LIMIT)
            ->get();

        return Inertia::render('board', [
            'rows' => BoardAppointmentResource::collection($appointments)->resolve(),
        ]);
    }
}
