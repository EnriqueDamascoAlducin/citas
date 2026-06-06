import { Head, Link, useHttp } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AppointmentProduct = {
    id: number;
    pivot: { quantity: number; price: number };
};

type Appointment = {
    id: number;
    start_time: string;
    end_time: string;
    status: string;
    notes: string | null;
    total_amount: number;
    service: { id: number; name: string; price: number };
    employee: { id: number; name: string };
    products: AppointmentProduct[];
    payments: Array<{ id: number; status: string; amount: number }>;
};

export default function AppointmentShow({ appointment }: { appointment: Appointment }) {
    const { post, processing } = useHttp({ appointment_id: appointment.id });

    function payWithMercadoPago() {
        post('/payments/preference', {
            onSuccess: (res) => {
                if (res.init_point) {
                    window.location.href = res.init_point;
                }
            },
        });
    }

    const statusLabels: Record<string, string> = {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        completed: 'Completada',
        cancelled: 'Cancelada',
    };

    const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
        pending: 'secondary',
        confirmed: 'default',
        completed: 'outline',
        cancelled: 'destructive',
    };

    return (
        <>
            <Head title="Cita Confirmada" />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold">Cita agendada con éxito</h1>
                    <p className="mt-1 text-muted-foreground">Tu cita # {appointment.id} ha sido registrada</p>
                </div>

                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Detalle de la Cita</span>
                            <Badge variant={statusVariant[appointment.status] ?? 'secondary'}>
                                {statusLabels[appointment.status] ?? appointment.status}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Servicio</span>
                            <span className="font-medium">{appointment.service.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Profesional</span>
                            <span className="font-medium">{appointment.employee.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Fecha</span>
                            <span className="font-medium">
                                {new Date(appointment.start_time).toLocaleDateString('es-MX', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Horario</span>
                            <span className="font-medium">
                                {new Date(appointment.start_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} —{' '}
                                {new Date(appointment.end_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        {appointment.products.length > 0 && (
                            <div className="border-t pt-3">
                                <p className="mb-2 text-sm font-medium text-muted-foreground">Productos</p>
                                {appointment.products.map((p) => (
                                    <div key={p.id} className="flex justify-between text-sm">
                                        <span>{p.pivot.quantity}x {p.name || `Producto #${p.id}`}</span>
                                        <span>${(Number(p.pivot.price) * p.pivot.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between border-t pt-3">
                            <span className="font-semibold">Total</span>
                            <span className="font-semibold">${Number(appointment.total_amount).toFixed(2)}</span>
                        </div>

                        {appointment.notes && (
                            <div className="border-t pt-3">
                                <span className="text-sm text-muted-foreground">Notas:</span>
                                <p className="mt-1 text-sm">{appointment.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {appointment.status === 'pending' && (
                    <div className="mt-6 flex justify-center">
                        <Button onClick={payWithMercadoPago} disabled={processing} className="w-full max-w-xs">
                            {processing ? 'Procesando...' : 'Pagar con Mercado Pago'}
                        </Button>
                    </div>
                )}

                <div className="mt-6 flex justify-center gap-4">
                    <Link href="/booking">
                        <Button variant="outline">Agendar otra cita</Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button>Ir al Dashboard</Button>
                    </Link>
                </div>
            </div>
        </>
    );
}

AppointmentShow.layout = {
    breadcrumbs: [
        { title: 'Cita Confirmada', href: '#' },
    ],
};
