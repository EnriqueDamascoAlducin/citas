import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Cell } from 'recharts';

type AppointmentItem = {
    id: number;
    client_name: string;
    employee_name: string;
    service: string;
    date: string;
    start_time: string;
    status: string;
    total_amount: number;
};

type Employee = {
    id: number;
    name: string;
};

interface PageProps {
    stats: {
        range_appointments: number;
        range_completed: number;
        range_revenue: number;
        total_users: number;
        total_products: number;
    };
    appointments: {
        data: AppointmentItem[];
        meta: any;
    };
    appointments_by_day: Array<{ date: string; count: number }>;
    revenue_by_day: Array<{ date: string; total: number }>;
    revenue_by_employee: Array<{ employee_name: string; total: number }>;
    filters: { status: string; employee_id: string; date_from: string; date_to: string };
    employees: Employee[];
}

function dateRangeLabel(from: string, to: string) {
    const f = new Date(from + 'T00:00:00');
    const t = new Date(to + 'T00:00:00');
    const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return `${f.toLocaleDateString('es-MX', opts)} — ${t.toLocaleDateString('es-MX', opts)}`;
}

export default function AdminDashboard({ stats, appointments, appointments_by_day, revenue_by_day, revenue_by_employee, filters, employees }: PageProps) {
    const [empId, setEmpId] = useState(filters.employee_id || '');
    const [from, setFrom] = useState(filters.date_from || '');
    const [to, setTo] = useState(filters.date_to || '');

    const statusLabel: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' };
    const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = { pending: 'secondary', confirmed: 'default', completed: 'outline', cancelled: 'destructive' };

    function applyFilter() {
        router.get('/admin/dashboard', { employee_id: empId, date_from: from, date_to: to });
    }

    const rangeLabel = dateRangeLabel(filters.date_from, filters.date_to);

    return (
        <>
            <Head title="Dashboard Admin" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">{rangeLabel}</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={empId}
                            onChange={(e) => setEmpId(e.target.value)}
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="">Todos los empleados</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="max-w-36 h-9" />
                        <span className="text-muted-foreground">—</span>
                        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="max-w-36 h-9" />
                        <Button variant="outline" size="sm" onClick={applyFilter}>Filtrar</Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Citas en Rango</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{stats.range_appointments}</p>
                            <p className="text-xs text-muted-foreground">{stats.range_completed} completadas</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ingresos en Rango</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">${Number(stats.range_revenue).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">de citas completadas</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Usuarios</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{stats.total_users}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Productos en Stock</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{stats.total_products}</p></CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Citas por Día</CardTitle></CardHeader>
                        <CardContent>
                            {appointments_by_day.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={appointments_by_day}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
                                        <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                                        <Tooltip
                                            labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('es-MX')}
                                            formatter={(value, name) => [value, 'Citas']}
                                            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }}
                                        />
                                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay citas en este período</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm">Ingresos por Día</CardTitle></CardHeader>
                        <CardContent>
                            {revenue_by_day.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={revenue_by_day}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
                                        <YAxis tickFormatter={(v) => `$${v}`} stroke="hsl(var(--muted-foreground))" />
                                        <Tooltip
                                            labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('es-MX')}
                                            formatter={(value, name) => [`$${Number(value).toFixed(2)}`, 'Ingresos']}
                                            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay ingresos en este período</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {revenue_by_employee.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Ingresos por Empleado</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {revenue_by_employee.map((emp, i) => (
                                    <div key={emp.employee_name} className="flex items-center gap-3">
                                        <span className="w-32 truncate text-sm font-medium">{emp.employee_name}</span>
                                        <div className="flex-1 rounded-full bg-muted h-5 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all"
                                                style={{ width: `${(emp.total / Math.max(...revenue_by_employee.map(e => e.total))) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-24 text-right text-sm font-semibold">${emp.total.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle className="text-base">Todas las Citas</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-3 py-2 text-left font-medium">Cliente</th>
                                        <th className="px-3 py-2 text-left font-medium">Empleado</th>
                                        <th className="px-3 py-2 text-left font-medium">Servicio</th>
                                        <th className="px-3 py-2 text-left font-medium">Fecha</th>
                                        <th className="px-3 py-2 text-left font-medium">Estado</th>
                                        <th className="px-3 py-2 text-right font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.data.map((apt) => (
                                        <tr key={apt.id} className="border-b last:border-0">
                                            <td className="px-3 py-2">{apt.client_name}</td>
                                            <td className="px-3 py-2">{apt.employee_name}</td>
                                            <td className="px-3 py-2">{apt.service}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{apt.date} {apt.start_time}</td>
                                            <td className="px-3 py-2"><Badge variant={statusVariant[apt.status] ?? 'secondary'}>{statusLabel[apt.status] ?? apt.status}</Badge></td>
                                            <td className="px-3 py-2 text-right">${Number(apt.total_amount).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [{ title: 'Panel Admin', href: '/admin/dashboard' }],
};
