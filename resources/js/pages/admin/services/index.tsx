import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Service } from '@/types';

interface ServicesPageProps {
    services: {
        data: Service[];
        meta: {
            current_page: number;
            last_page: number;
            from: number;
            to: number;
            total: number;
        };
    };
    filters: {
        search?: string;
    };
}

export default function ServicesIndex({ services, filters }: ServicesPageProps) {
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    function openCreate() {
        setEditingService(null);
        setShowModal(true);
    }

    function openEdit(service: Service) {
        setEditingService(service);
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingService(null);
    }

    function deleteService(service: Service) {
        if (confirm(`¿Eliminar el servicio "${service.name}"?`)) {
            router.delete(`/admin/services/${service.id}`);
        }
    }

    return (
        <>
            <Head title="Servicios" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Servicios" description="Gestiona los servicios que ofrece el negocio" />
                    <Button onClick={openCreate}>Nuevo Servicio</Button>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                                <th className="px-4 py-3 text-left font-medium">Duración</th>
                                <th className="px-4 py-3 text-left font-medium">Precio</th>
                                <th className="px-4 py-3 text-left font-medium">Estado</th>
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.data.map((service) => (
                                <tr key={service.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">{service.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{service.duration_minutes} min</td>
                                    <td className="px-4 py-3">${Number(service.price).toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={service.active ? 'default' : 'secondary'}>
                                            {service.active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="outline" size="sm" onClick={() => openEdit(service)}>
                                            Editar
                                        </Button>
                                        <Button variant="destructive" size="sm" className="ml-2" onClick={() => deleteService(service)}>
                                            Eliminar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {services.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        No hay servicios registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {services.meta.total > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Mostrando {services.meta.from}-{services.meta.to} de {services.meta.total}</span>
                        <div className="flex gap-2">
                            {Array.from({ length: services.meta.last_page }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === services.meta.current_page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => router.get(`/admin/services?page=${page}`)}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={showModal} onOpenChange={(open) => { if (!open) closeModal(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
                        <DialogDescription>
                            {editingService ? 'Actualiza los datos del servicio.' : 'Registra un nuevo servicio.'}
                        </DialogDescription>
                    </DialogHeader>

                    <Form
                        action={editingService ? `/admin/services/${editingService.id}` : '/admin/services'}
                        method={editingService ? 'patch' : 'post'}
                        onSuccess={() => closeModal()}
                        resetOnSuccess
                        setDefaultsOnSuccess
                    >
                        {({ errors, processing }) => (
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={editingService?.name ?? ''}
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                                        defaultValue={editingService?.description ?? ''}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="duration_minutes">Duración (minutos)</Label>
                                        <Input
                                            id="duration_minutes"
                                            name="duration_minutes"
                                            type="number"
                                            defaultValue={editingService?.duration_minutes ?? 30}
                                        />
                                        {errors.duration_minutes && <p className="text-sm text-destructive">{errors.duration_minutes}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="price">Precio ($)</Label>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingService?.price ?? 0}
                                        />
                                        {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        id="active"
                                        name="active"
                                        type="checkbox"
                                        value="1"
                                        defaultChecked={editingService?.active ?? true}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <Label htmlFor="active">Servicio activo</Label>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={closeModal}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {editingService ? 'Actualizar' : 'Crear'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ServicesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Servicios',
            href: '/admin/services',
        },
    ],
};
