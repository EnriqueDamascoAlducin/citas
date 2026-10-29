import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AgendaAppointment = {
    id: number;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    service: string | null;
    duration_minutes: number | null;
    client: { name: string; phone: string | null; email: string | null };
    notes: string | null;
    products: Array<{ name: string; quantity: number }>;
    total_amount: number;
    is_paid: boolean;
};

interface AgendaPageProps {
    date: string;
    isToday: boolean;
    appointments: AgendaAppointment[];
    summary: { total: number; completed: number; pending_payment: number; expected_revenue: number };
    week: Array<{ date: string; count: number }>;
    workingHours: Array<{ start: string; end: string }>;
    dayOffReason: string | null;
    canEditSchedule: boolean;
}

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const STATUS: Record<AgendaAppointment['status'], { label: string; dot: string }> = {
    pending: { label: 'Por confirmar', dot: 'bg-amber-500' },
    confirmed: { label: 'Confirmada', dot: 'bg-emerald-500' },
    completed: { label: 'Completada', dot: 'bg-stone-400' },
    cancelled: { label: 'Cancelada', dot: 'bg-red-500' },
    no_show: { label: 'No asistió', dot: 'bg-red-500' },
};

function parseDate(value: string): Date {
    const [y, m, d] = value.split('-').map(Number);

    return new Date(y, m - 1, d);
}

function shiftDate(value: string, days: number): string {
    const d = parseDate(value);
    d.setDate(d.getDate() + days);
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function money(value: number): string {
    return `$${value.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`;
}

function nowHHMM(): string {
    const d = new Date();

    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ProfessionalAgendaPage({ date, isToday, appointments, summary, week, workingHours, dayOffReason, canEditSchedule }: AgendaPageProps) {
    const current = parseDate(date);
    const longDate = `${DAY_LONG[current.getDay()]} ${current.getDate()} de ${MONTH_LONG[current.getMonth()]}`;
    const isOpen = (a: AgendaAppointment) => a.status === 'pending' || a.status === 'confirmed';
    const nextId = isToday ? appointments.find((a) => isOpen(a) && a.end_time > nowHHMM())?.id : undefined;

    function setStatus(appointment: AgendaAppointment, status: AgendaAppointment['status']) {
        if ((status === 'cancelled' || status === 'no_show') && !confirm(`¿Marcar la cita de ${appointment.client.name} como "${STATUS[status].label}"?`)) {
            return;
        }

        router.patch(`/employee/appointments/${appointment.id}/status`, { status }, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Mi agenda" />

            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-4 md:p-6">
                {/* Encabezado y navegación por día */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">{isToday ? 'Hoy' : 'Agenda'}</p>
                        <h1 className="text-2xl font-semibold tracking-tight">{longDate}</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={`/profesional?date=${shiftDate(date, -1)}`} preserveScroll aria-label="Día anterior">
                                <ChevronLeft />
                            </Link>
                        </Button>
                        {!isToday && (
                            <Button variant="outline" asChild>
                                <Link href="/profesional">Hoy</Link>
                            </Button>
                        )}
                        <Button variant="outline" size="icon" asChild>
                            <Link href={`/profesional?date=${shiftDate(date, 1)}`} preserveScroll aria-label="Día siguiente">
                                <ChevronRight />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Semana */}
                <nav className="grid grid-cols-7 gap-1" aria-label="Semana">
                    {week.map((day) => {
                        const d = parseDate(day.date);
                        const selected = day.date === date;

                        return (
                            <Link
                                key={day.date}
                                href={`/profesional?date=${day.date}`}
                                preserveScroll
                                aria-current={selected ? 'date' : undefined}
                                className={`rounded-md border px-1 py-2 text-center transition-colors ${
                                    selected ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'
                                }`}
                            >
                                <span className={`block text-xs ${selected ? '' : 'text-muted-foreground'}`}>{DAY_SHORT[d.getDay()]}</span>
                                <span className="block text-lg font-semibold tabular-nums">{d.getDate()}</span>
                                <span className={`block text-xs ${selected ? '' : 'text-muted-foreground'}`}>
                                    {day.count > 0 ? `${day.count} cita${day.count > 1 ? 's' : ''}` : '—'}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Resumen del día */}
                <dl className="grid grid-cols-2 gap-y-4 border-y py-4 sm:grid-cols-4">
                    {[
                        ['Citas', String(summary.total)],
                        ['Completadas', String(summary.completed)],
                        ['Por confirmar', String(summary.pending_payment)],
                        ['Ingreso esperado', money(summary.expected_revenue)],
                    ].map(([label, value], i) => (
                        <div key={label} className={i > 0 ? 'sm:border-l sm:pl-4' : ''}>
                            <dt className="text-xs text-muted-foreground">{label}</dt>
                            <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
                        </div>
                    ))}
                </dl>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p className="text-muted-foreground">
                        {dayOffReason
                            ? `No trabajas este día: ${dayOffReason}.`
                            : workingHours.length > 0
                              ? `Tu horario: ${workingHours.map((h) => `${h.start}–${h.end}`).join(', ')}`
                              : 'No tienes horario este día.'}
                    </p>
                    {canEditSchedule && (
                        <Link href="/employee/schedule" className="font-medium text-primary underline-offset-4 hover:underline">
                            Editar mi horario
                        </Link>
                    )}
                </div>

                {/* Citas */}
                {appointments.length === 0 ? (
                    <p className="py-10 text-center text-muted-foreground">Sin citas este día.</p>
                ) : (
                    <ol className="divide-y rounded-lg border">
                        {appointments.map((apt) => {
                            const status = STATUS[apt.status];
                            const isNext = apt.id === nextId;
                            const closed = !isOpen(apt);

                            return (
                                <li
                                    key={apt.id}
                                    className={`grid gap-4 border-l-2 p-4 sm:grid-cols-[72px_1fr_auto] ${isNext ? 'border-l-primary bg-accent/40' : 'border-l-transparent'} ${closed ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex items-baseline gap-2 sm:block">
                                        <p className="text-lg font-semibold tabular-nums">{apt.start_time}</p>
                                        <p className="text-xs text-muted-foreground tabular-nums">hasta {apt.end_time}</p>
                                        {isNext && <p className="text-xs font-medium text-primary sm:mt-1">Siguiente</p>}
                                    </div>

                                    <div className="min-w-0 space-y-1">
                                        <p className="font-medium">{apt.client.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {apt.service}
                                            {apt.duration_minutes ? ` · ${apt.duration_minutes} min` : ''} · {money(apt.total_amount)}
                                            {apt.is_paid ? ' · pagada' : ''}
                                        </p>
                                        {apt.client.phone && (
                                            <a href={`tel:${apt.client.phone}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                                <Phone className="size-3.5" />
                                                {apt.client.phone}
                                            </a>
                                        )}
                                        {apt.products.length > 0 && (
                                            <p className="text-sm">Productos: {apt.products.map((p) => `${p.name} ×${p.quantity}`).join(', ')}</p>
                                        )}
                                        {apt.notes && <p className="text-sm text-muted-foreground">Nota: “{apt.notes}”</p>}
                                    </div>

                                    <div className="flex flex-wrap items-start gap-2 sm:flex-col sm:items-end">
                                        <span className="flex items-center gap-1.5 text-sm">
                                            <span className={`size-2 rounded-full ${status.dot}`} aria-hidden />
                                            {status.label}
                                        </span>
                                        {!closed && (
                                            <div className="flex flex-wrap gap-1.5 sm:justify-end">
                                                {apt.status === 'pending' && (
                                                    <Button size="sm" variant="outline" onClick={() => setStatus(apt, 'confirmed')}>
                                                        Confirmar
                                                    </Button>
                                                )}
                                                <Button size="sm" onClick={() => setStatus(apt, 'completed')}>
                                                    Completar
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setStatus(apt, 'no_show')}>
                                                    No asistió
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(apt, 'cancelled')}>
                                                    Cancelar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>
        </>
    );
}

ProfessionalAgendaPage.layout = {
    breadcrumbs: [{ title: 'Mi agenda', href: '/profesional' }],
};
