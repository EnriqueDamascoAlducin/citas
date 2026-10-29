<?php

use App\Enums\Permission;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProductCategoryController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\UserPermissionController;
use App\Http\Controllers\Api\AvailabilityController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\Auth\CustomerAuthController;
use App\Http\Controllers\Client\AppointmentController as ClientAppointmentController;
use App\Http\Controllers\CustomerDashboardController;
use App\Http\Controllers\Employee\AppointmentController as EmployeeAppointmentController;
use App\Http\Controllers\Employee\ScheduleController;
use App\Http\Controllers\Employee\ScheduleExceptionController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Professional\AgendaController as ProfessionalAgendaController;
use App\Http\Controllers\Professional\AppointmentBoardController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\Webhooks\TwilioWhatsAppController;
use App\Http\Middleware\VerifyTwilioSignature;
use App\Models\Appointment;
use App\Models\ProductCategory;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

Route::get('api/employees', [AvailabilityController::class, 'employees'])->name('api.employees');
Route::get('api/slots', [AvailabilityController::class, 'slots'])->name('api.slots');
Route::get('api/employees-availability', [AvailabilityController::class, 'employeesAvailability'])->name('api.employees-availability');

Route::get('/', function () {
    $services = Service::where('active', true)
        ->withCount('appointments')
        ->orderBy('appointments_count', 'desc')
        ->orderBy('name')
        ->get();

    $productCategories = ProductCategory::whereHas('products', fn ($q) => $q->where('active', true)->where('stock', '>', 0))
        ->with(['products' => fn ($q) => $q->where('active', true)->where('stock', '>', 0)])
        ->get();

    $employees = collect();
    if (Role::where('name', 'employee')->exists()) {
        $employees = User::role('employee')
            ->with('schedules')
            ->orderBy('name')
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'schedules' => $user->schedules
                    ->groupBy('day_of_week')
                    ->map(fn ($slots) => $slots->map(fn ($s) => [
                        'start_time' => $s->start_time->format('H:i'),
                        'end_time' => $s->end_time->format('H:i'),
                    ])),
            ]);
    }

    return Inertia::render('welcome', [
        'services' => $services,
        'productCategories' => $productCategories,
        'employees' => $employees,
        'heroImage' => asset('storage/images/hero.png'),
        'logoImage' => asset('storage/images/logo.png'),
    ]);
})->name('home');

Route::redirect('booking', '/')->name('booking');

// Cada usuario del personal entra a la sección que le corresponde según sus permisos.
Route::get('panel', fn (Request $request) => redirect($request->user()->homeUrl()))->middleware('auth')->name('panel');
Route::redirect('/admin', '/panel');

// Panel del personal: cada sección exige su propio permiso, sea por rol o asignado al usuario.
Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard')->can(Permission::ViewDashboard->value);

    Route::middleware('can:'.Permission::ManageServices->value)->group(function () {
        Route::resource('services', ServiceController::class)->except(['show']);
    });

    Route::middleware('can:'.Permission::ManageProducts->value)->group(function () {
        Route::resource('products', ProductController::class)->except(['show']);
        Route::post('product-categories', [ProductCategoryController::class, 'store'])->name('product-categories.store');
        Route::delete('product-categories/{category}', [ProductCategoryController::class, 'destroy'])->name('product-categories.destroy');
    });

    Route::middleware('can:'.Permission::ManageEmployees->value)->group(function () {
        Route::resource('users', UserController::class)->except(['show']);
        Route::put('users/{user}/permissions', [UserPermissionController::class, 'update'])->name('users.permissions.update');
    });

    Route::middleware('can:'.Permission::ManageCustomers->value)->group(function () {
        Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
    });
});

Route::middleware(['auth'])->prefix('employee')->name('employee.')->group(function () {
    Route::get('appointments', [EmployeeAppointmentController::class, 'index'])->name('appointments.index')->can('viewAny', Appointment::class);
    Route::patch('appointments/{appointment}/status', [EmployeeAppointmentController::class, 'updateStatus'])->name('appointments.update-status');

    Route::middleware('can:'.Permission::ManageSchedule->value)->group(function () {
        Route::get('schedule', [ScheduleController::class, 'index'])->name('schedule.index');
        Route::post('schedule', [ScheduleController::class, 'store'])->name('schedule.store');
        Route::delete('schedule/{schedule}', [ScheduleController::class, 'destroy'])->name('schedule.destroy');

        Route::post('schedule-exceptions', [ScheduleExceptionController::class, 'store'])->name('schedule-exceptions.store');
        Route::delete('schedule-exceptions/{exception}', [ScheduleExceptionController::class, 'destroy'])->name('schedule-exceptions.destroy');
    });
});

Route::get('profesional', ProfessionalAgendaController::class)
    ->middleware(['auth', 'can:'.Permission::ViewAppointments->value])
    ->name('professional.agenda');

// Pantalla de próximas citas para la TV de recepción.
Route::get('tablero', AppointmentBoardController::class)
    ->middleware(['auth', 'can:'.Permission::ViewBoard->value])
    ->name('board');

Route::post('appointments', [AppointmentController::class, 'store'])->name('appointments.store');

Route::post('payments/preference', [PaymentController::class, 'createPreference'])->name('payments.preference');

Route::post('process_payment', [PaymentController::class, 'processCardPayment'])->name('payments.process');

Route::get('appointments/{appointment}', function (Appointment $appointment) {
    $appointment->load(['service', 'employee', 'products', 'payments']);

    return Inertia::render('appointments/show', ['appointment' => $appointment]);
})->name('appointments.show');

Route::middleware(['auth'])->group(function () {
    Route::get('my-appointments', [ClientAppointmentController::class, 'index'])->name('my-appointments.index');
    Route::patch('my-appointments/{appointment}/cancel', [ClientAppointmentController::class, 'cancel'])->name('my-appointments.cancel');
});

Route::post('webhook/mercadopago', [WebhookController::class, 'mpIpn'])->name('webhook.mp');

// Respuestas al recordatorio de WhatsApp. Twilio firma cada petición.
Route::post('webhooks/twilio/whatsapp', TwilioWhatsAppController::class)
    ->middleware([VerifyTwilioSignature::class, 'throttle:120,1'])
    ->name('webhooks.twilio.whatsapp');

Route::prefix('cliente')->name('customer.')->group(function () {
    Route::get('login', [CustomerAuthController::class, 'showLogin'])->name('login');
    Route::post('login', [CustomerAuthController::class, 'login']);
    Route::get('register', [CustomerAuthController::class, 'showRegister'])->name('register');
    Route::post('register', [CustomerAuthController::class, 'register']);
    Route::post('logout', [CustomerAuthController::class, 'logout'])->name('logout');
});

Route::middleware(['auth:customer'])->group(function () {
    Route::get('mi-cuenta', [CustomerDashboardController::class, 'index'])->name('customer.dashboard');
});

require __DIR__.'/settings.php';
