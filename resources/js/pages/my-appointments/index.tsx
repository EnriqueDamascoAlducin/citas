import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Service } from '@/types';

type AppointmentItem = {
    id: number;
    start_time: string;
    end_time: string;
    status: string;
    total_amount: number;
    notes: string | null;
    service: Service;
    employee: { id: number; name: string };
    payments: Array<{ id: number; status: string; amount: number }>;
};

interface PageProps {
    appointments: {
        data: AppointmentItem[];
        meta: any;
    };
}

export default function MyAppointments({ appointments }: PageProps) {
    function cancelAppointment(id: number) {
        if (confirm('¿Cancelar esta cita?')) {
            router.patch(`/my-appointments/${id}/cancel`);
        }
    }

    const statusLabel: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' };
    const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = { pending: 'secondary', confirmed: 'default', completed: 'outline', cancelled: 'destructive' };

    return (
        <>
            <Head title="Mis Citas" />

            <div className="mx-auto max-w-3xl px-4 py-8">
                <h1 className="mb-6 text-2xl font-bold">Mis Citas</h1>

                {appointments.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No tienes citas registradas.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {appointments.data.map((apt) => (
                            <Card key={apt.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{apt.service.name}</CardTitle>
                                        <Badge variant={statusVariant[apt.status] ?? 'secondary'}>{statusLabel[apt.status] ?? apt.status}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Profesional</span>
                                            <span>{apt.employee.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Fecha</span>
                                            <span>{new Date(apt.start_time).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Horario</span>
                                            <span>{new Date(apt.start_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.end_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2">
                                            <span className="font-medium">Total</span>
                                            <span className="font-medium">${Number(apt.total_amount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                        <div className="mt-3 flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => router.get(`/appointments/${apt.id}`)}>Ver detalle</Button>
                                            <Button variant="destructive" size="sm" onClick={() => cancelAppointment(apt.id)}>Cancelar cita</Button>
                                        </div>
                                    )}
                                    {apt.status === 'completed' && (
                                        <Button variant="outline" size="sm" className="mt-3" onClick={() => router.get(`/appointments/${apt.id}`)}>Ver detalle</Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

MyAppointments.layout = {
    breadcrumbs: [{ title: 'Mis Citas', href: '/my-appointments' }],
};
