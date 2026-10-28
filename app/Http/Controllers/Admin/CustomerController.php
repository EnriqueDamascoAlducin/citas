<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = Customer::orderBy('name')
            ->paginate(15);

        return Inertia::render('admin/customers/index', [
            'customers' => static::paginateResponse($customers),
        ]);
    }

    public function destroy(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($request->user()->can('manage-employees'), 403);

        // Las citas y pagos se conservan; customer_id queda en null.
        $customer->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente eliminado correctamente.']);

        return to_route('admin.customers.index');
    }
}
