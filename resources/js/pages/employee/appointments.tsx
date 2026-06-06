import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type AppointmentItem = {
    id: number;
    client_name: string;
    client_email: string;
    employee_name?: string;
    service: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    notes: string | null;
    total_amount: number;
};

type Employee = {
    id: number;
    name: string;
};

interface PageProps {
    appointments: {
        data: AppointmentItem[];
        meta: any;
    };
    date_from: string;
    date_to: string;
    is_admin: boolean;
    employees: Employee[];
    employee_id: string;
}

export default function EmployeeAppointments({ appointments, date_from, date_to, is_admin, employees, employee_id: empId }: PageProps) {
    const [from, setFrom] = useState(date_from);
    const [to, setTo] = useState(date_to);
    const [filterEmpId, setFilterEmpId] = useState(empId);

    function applyFilter() {
        const params: Record<string, string> = { date_from: from, date_to: to };
        if (is_admin && filterEmpId) params.employee_id = filterEmpId;
        router.get('/employee/appointments', params);
    }

    function updateStatus(id: number, status: string) {
        router.patch(`/employee/appointments/${id}/status`, { status });
    }

    const statusLabel: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' };
    const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = { pending: 'secondary', confirmed: 'default', completed: 'outline', cancelled: 'destructive' };

    return (
        <>
            <Head title="Citas" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Heading title="Citas" description={is_admin ? 'Todas las citas' : 'Mis citas'} />
                    <div className="flex flex-wrap items-center gap-2">
                        {is_admin && (
                            <select
                                value={filterEmpId}
                                onChange={(e) => setFilterEmpId(e.target.value)}
                                className="h-9 rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">Todos los empleados</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        )}
                        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="max-w-36 h-9" />
                        <span className="text-muted-foreground">—</span>
                        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="max-w-36 h-9" />
                        <Button variant="outline" size="sm" onClick={applyFilter}>Filtrar</Button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                                {is_admin && <th className="px-4 py-3 text-left font-medium">Empleado</th>}
                                <th className="px-4 py-3 text-left font-medium">Servicio</th>
                                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                                <th className="px-4 py-3 text-left font-medium">Horario</th>
                                <th className="px-4 py-3 text-left font-medium">Estado</th>
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.data.map((apt) => (
                                <tr key={apt.id} className="border-b last:border-0">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{apt.client_name}</p>
                                        <p className="text-xs text-muted-foreground">{apt.client_email}</p>
                                    </td>
                                    {is_admin && <td className="px-4 py-3">{apt.employee_name}</td>}
                                    <td className="px-4 py-3">{apt.service}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{apt.date}</td>
                                    <td className="px-4 py-3">{apt.start_time} - {apt.end_time}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={statusVariant[apt.status] ?? 'secondary'}>{statusLabel[apt.status] ?? apt.status}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {apt.status === 'pending' && (
                                            <Button variant="outline" size="sm" onClick={() => updateStatus(apt.id, 'confirmed')}>Confirmar</Button>
                                        )}
                                        {apt.status === 'confirmed' && (
                                            <Button variant="outline" size="sm" onClick={() => updateStatus(apt.id, 'completed')} className="text-green-600">Completar</Button>
                                        )}
                                        {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                            <Button variant="destructive" size="sm" className="ml-1" onClick={() => updateStatus(apt.id, 'cancelled')}>Cancelar</Button>
                                        )}
                                        {apt.notes && (
                                            <span className="ml-2 cursor-help text-xs text-muted-foreground" title={apt.notes}>Nota</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {appointments.data.length === 0 && (
                                <tr>
                                    <td colSpan={is_admin ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">No hay citas en este rango.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

EmployeeAppointments.layout = {
    breadcrumbs: [{ title: 'Citas', href: '/employee/appointments' }],
};
