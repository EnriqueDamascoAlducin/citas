<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use App\Support\PhoneNumber;
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
            'canEdit' => $request->user()->can(Permission::EditCustomers->value),
        ]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->fill([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'phone' => PhoneNumber::normalize($request->validated('phone')),
        ]);

        if ($request->filled('password')) {
            $customer->password = $request->validated('password');
        }

        $customer->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Datos del cliente actualizados.']);

        return back();
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        // Las citas y pagos se conservan; customer_id queda en null.
        $customer->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente eliminado correctamente.']);

        return to_route('admin.customers.index');
    }
}
