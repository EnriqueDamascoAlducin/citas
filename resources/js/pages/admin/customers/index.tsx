import { Head, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useState } from 'react';

type CustomerItem = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    created_at: string;
    appointments_count: number;
};

interface PageProps {
    customers: {
        data: CustomerItem[];
        meta: {
            current_page: number;
            last_page: number;
            from: number;
            to: number;
            total: number;
        };
    };
}

export default function CustomersIndex({ customers }: PageProps) {
    const [deleteTarget, setDeleteTarget] = useState<CustomerItem | null>(null);

    function handleDelete(customer: CustomerItem) {
        router.delete(`/admin/customers/${customer.id}`, {
            preserveState: true,
            preserveScroll: true,
        });
        setDeleteTarget(null);
    }

    return (
        <>
            <Head title="Clientes" />
            <div className="flex items-center justify-between">
                <Heading title="Clientes" description="Listado de clientes registrados" />
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-stone-800">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-stone-800 bg-stone-900/50">
                            <th className="px-4 py-3 text-left font-medium text-stone-400">Nombre</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-400">Email</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-400">Teléfono</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-400">Registrado</th>
                            <th className="px-4 py-3 text-right font-medium text-stone-400">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                                    No hay clientes registrados.
                                </td>
                            </tr>
                        ) : (
                            customers.data.map((customer) => (
                                <tr key={customer.id} className="border-b border-stone-800/50 transition-colors hover:bg-stone-900/30">
                                    <td className="px-4 py-3 font-medium text-stone-100">{customer.name}</td>
                                    <td className="px-4 py-3 text-stone-400">{customer.email}</td>
                                    <td className="px-4 py-3 text-stone-400">{customer.phone || '—'}</td>
                                    <td className="px-4 py-3 text-stone-400">{new Date(customer.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setDeleteTarget(customer)}
                                        >
                                            Eliminar
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {customers.meta.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-stone-400">
                    <span>
                        Mostrando {customers.meta.from}–{customers.meta.to} de {customers.meta.total}
                    </span>
                    <div className="flex gap-2">
                        {customers.meta.current_page > 1 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(`/admin/customers?page=${customers.meta.current_page - 1}`)}
                            >
                                Anterior
                            </Button>
                        )}
                        {customers.meta.current_page < customers.meta.last_page && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(`/admin/customers?page=${customers.meta.current_page + 1}`)}
                            >
                                Siguiente
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar cliente</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de eliminar a <strong>{deleteTarget?.name}</strong>? También se eliminarán sus citas. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>
                            Eliminar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
