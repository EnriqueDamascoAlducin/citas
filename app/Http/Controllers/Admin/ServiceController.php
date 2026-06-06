<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceRequest;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function index(Request $request): Response
    {
        $services = Service::query()
            ->when($request->search, fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/services/index', [
            'services' => static::paginateResponse($services),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        Service::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Servicio creado correctamente.']);

        return to_route('admin.services.index');
    }

    public function update(StoreServiceRequest $request, Service $service): RedirectResponse
    {
        $service->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Servicio actualizado correctamente.']);

        return to_route('admin.services.index');
    }

    public function destroy(Service $service): RedirectResponse
    {
        $service->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Servicio eliminado correctamente.']);

        return to_route('admin.services.index');
    }
}
