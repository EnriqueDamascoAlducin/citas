import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Service } from '@/types';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

type ScheduleItem = {
    id: number;
    user_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    active: boolean;
};

type ExceptionItem = {
    id: number;
    user_id: number;
    date: string;
    start_time: string | null;
    end_time: string | null;
    available: boolean;
    reason: string | null;
};

interface PageProps {
    schedules: Record<string, ScheduleItem[]>;
    exceptions: ExceptionItem[];
    employees: Array<{ id: number; name: string }>;
    selectedEmployeeId: number;
}

export default function EmployeeSchedule({ schedules, exceptions, employees, selectedEmployeeId }: PageProps) {
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showExceptionModal, setShowExceptionModal] = useState(false);

    function changeEmployee(id: string) {
        router.get('/employee/schedule', { employee_id: id });
    }

    function deleteSchedule(id: number) {
        if (confirm('¿Eliminar este horario?')) {
            router.delete(`/employee/schedule/${id}`, { data: { employee_id: selectedEmployeeId } });
        }
    }

    function deleteException(id: number) {
        if (confirm('¿Eliminar esta excepción?')) {
            router.delete(`/employee/schedule-exceptions/${id}`, { data: { employee_id: selectedEmployeeId } });
        }
    }

    return (
        <>
            <Head title="Mi Horario" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Heading title="Mi Horario" description="Gestiona tu disponibilidad semanal" />
                        {employees.length > 0 && (
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => changeEmployee(e.target.value)}
                                className="border-input bg-background ring-offset-background h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                            >
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowExceptionModal(true)}>
                            Añadir Excepción
                        </Button>
                        <Button onClick={() => setShowScheduleModal(true)}>
                            Añadir Horario
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 7 }, (_, i) => i).map((day) => {
                        const daySchedules = schedules[String(day)] ?? [];
                        return (
                            <Card key={day}>
                                <CardHeader>
                                    <CardTitle className="text-base">{DAY_NAMES[day]}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {daySchedules.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Sin horario</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {daySchedules.map((s) => (
                                                <li key={s.id} className="flex items-center justify-between text-sm">
                                                    <span>{s.start_time} - {s.end_time}</span>
                                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteSchedule(s.id)}>
                                                        ×
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {exceptions.length > 0 && (
                    <div className="mt-4">
                        <Heading title="Excepciones" description="Días con disponibilidad especial o días libres" variant="small" />
                        <div className="mt-2 overflow-x-auto rounded-xl border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium">Fecha</th>
                                        <th className="px-4 py-3 text-left font-medium">Tipo</th>
                                        <th className="px-4 py-3 text-left font-medium">Horario</th>
                                        <th className="px-4 py-3 text-left font-medium">Motivo</th>
                                        <th className="px-4 py-3 text-right font-medium">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exceptions.map((e) => (
                                        <tr key={e.id} className="border-b last:border-0">
                                            <td className="px-4 py-3">{e.date}</td>
                                            <td className="px-4 py-3">
                                                {e.available ? 'Disponible' : 'No disponible'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {e.start_time && e.end_time ? `${e.start_time} - ${e.end_time}` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{e.reason ?? '—'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="destructive" size="sm" onClick={() => deleteException(e.id)}>
                                                    Eliminar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo Horario</DialogTitle>
                        <DialogDescription>Agrega un bloque de disponibilidad semanal.</DialogDescription>
                    </DialogHeader>

                    <Form
                        action="/employee/schedule"
                        method="post"
                        onSuccess={() => setShowScheduleModal(false)}
                        resetOnSuccess
                    >
                        {({ errors, processing }) => (
                            <div className="grid gap-4">
                                <input type="hidden" name="employee_id" value={selectedEmployeeId} />
                                <div className="grid gap-2">
                                    <Label>Día de la semana</Label>
                                    <select name="day_of_week" className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden">
                                        {DAY_NAMES.map((name, i) => (
                                            <option key={i} value={i}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Hora inicio</Label>
                                        <Input name="start_time" type="time" defaultValue="09:00" />
                                        {errors.start_time && <p className="text-sm text-destructive">{errors.start_time}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Hora fin</Label>
                                        <Input name="end_time" type="time" defaultValue="18:00" />
                                        {errors.end_time && <p className="text-sm text-destructive">{errors.end_time}</p>}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowScheduleModal(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={processing}>Guardar</Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={showExceptionModal} onOpenChange={setShowExceptionModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excepción de Horario</DialogTitle>
                        <DialogDescription>Marca un día como no disponible o con horario especial.</DialogDescription>
                    </DialogHeader>

                    <Form
                        action="/employee/schedule-exceptions"
                        method="post"
                        onSuccess={() => setShowExceptionModal(false)}
                        resetOnSuccess
                    >
                        {({ errors, processing }) => (
                            <div className="grid gap-4">
                                <input type="hidden" name="employee_id" value={selectedEmployeeId} />
                                <div className="grid gap-2">
                                    <Label>Fecha</Label>
                                    <Input name="date" type="date" />
                                    {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                                </div>

                                <div className="flex items-center gap-2">
                                    <input id="exc_available" name="available" type="checkbox" value="1" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                                    <Label htmlFor="exc_available">Disponible (marcar para horario especial)</Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Hora inicio (opcional)</Label>
                                        <Input name="start_time" type="time" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Hora fin (opcional)</Label>
                                        <Input name="end_time" type="time" />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Motivo (opcional)</Label>
                                    <Input name="reason" />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowExceptionModal(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={processing}>Guardar</Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}

EmployeeSchedule.layout = {
    breadcrumbs: [
        { title: 'Mi Horario', href: '/employee/schedule' },
    ],
};
