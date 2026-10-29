import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    Field,
    btnGhost,
    btnPrimary,
    formatPrice,
    inputClass,
} from '@/components/site/site-shell';

type Service = {
    id: number;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: string | number;
};

type Employee = {
    id: number;
    name: string;
};

type TimeSlot = {
    time: string;
    end_time: string;
    display: string;
};

type ProductCategory = {
    id: number;
    name: string;
    description: string | null;
    products: Array<{
        id: number;
        name: string;
        description: string | null;
        price: number;
        stock: number;
    }>;
};

type Props = {
    services: Service[];
    productCategories: ProductCategory[];
    initialServiceId?: number;
    initialEmployeeId?: number;
};

const STEP_LABELS = [
    'Servicio',
    'Barbero',
    'Fecha y hora',
    'Productos',
    'Confirmar',
];
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_SHORT = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
];

/** YYYY-MM-DD en hora local (toISOString usa UTC y en la tarde ya da el día siguiente). */
function toLocalDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);

    return d;
}

function formatLongDate(value: string): string {
    if (!value) {
        return '';
    }

    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    return `${DAY_SHORT[date.getDay()]} ${d} ${MONTH_SHORT[m - 1]}`;
}

export default function BookingWizard({
    services,
    productCategories,
    initialServiceId,
    initialEmployeeId,
}: Props) {
    const { auth } = usePage().props;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showAllServices, setShowAllServices] = useState(false);

    const [selectedService, setSelectedService] = useState<Service | null>(
        null,
    );
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
        null,
    );
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<
        Record<number, number>
    >({});
    const [notes, setNotes] = useState('');
    const [phone, setPhone] = useState('');
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [registerForm, setRegisterForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });
    const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
    const [registerErrors, setRegisterErrors] = useState<
        Record<string, string>
    >({});
    const [shouldSubmitAfterAuth, setShouldSubmitAfterAuth] = useState(false);
    const [appointmentCreated, setAppointmentCreated] = useState(false);

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [alternativeEmployees, setAlternativeEmployees] = useState<
        Employee[]
    >([]);

    useEffect(() => {
        if (initialServiceId) {
            const found = services.find((s) => s.id === initialServiceId);

            if (found) {
                setSelectedService(found);
                setStep(2);
            }
        }

        if (initialEmployeeId) {
            setSelectedEmployee({ id: initialEmployeeId, name: '' });
        }
    }, [initialServiceId, initialEmployeeId, services]);

    useEffect(() => {
        if (
            step === 2 &&
            selectedService &&
            employees.length === 0 &&
            !loading
        ) {
            fetchEmployees();
        }
    }, [step, selectedService]);

    useEffect(() => {
        if (
            auth.customer &&
            shouldSubmitAfterAuth &&
            step === 6 &&
            !appointmentCreated
        ) {
            if (auth.customer.phone) {
                submitBooking();
            } else {
                // Cuenta sin teléfono: se pide en el paso de confirmar.
                setShouldSubmitAfterAuth(false);
                setStep(5);
            }
        }
    }, [auth.customer, shouldSubmitAfterAuth, step, appointmentCreated]);

    async function fetchEmployees() {
        if (!selectedService) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(
                `/api/employees?service_id=${selectedService.id}`,
            );
            const data = await res.json();
            setEmployees(data);
            setSelectedEmployee(null);

            if (data.length === 1) {
                setSelectedEmployee(data[0]);
                setStep(3);
            }
        } catch {
            setError('Error al cargar empleados');
        }

        setLoading(false);
    }

    async function fetchSlots() {
        if (!selectedEmployee || !selectedDate || !selectedService) {
            return;
        }

        setLoading(true);
        setError('');
        setAlternativeEmployees([]);

        try {
            const res = await fetch(
                `/api/slots?employee_id=${selectedEmployee.id}&date=${selectedDate}&service_id=${selectedService.id}`,
            );
            const data = await res.json();
            setSlots(data);
            setSelectedSlot(null);

            if (data.length === 0) {
                const altRes = await fetch(
                    `/api/employees-availability?date=${selectedDate}&service_id=${selectedService.id}&exclude_employee_id=${selectedEmployee.id}`,
                );
                const altData = await altRes.json();
                setAlternativeEmployees(altData);
            }
        } catch {
            setError('Error al cargar horarios');
        }

        setLoading(false);
    }

    function handleServiceSelect(service: Service) {
        setSelectedService(service);
        setSelectedEmployee(null);
        setSelectedDate('');
        setSelectedSlot(null);
        setSlots([]);
        setStep(2);
    }

    function handleEmployeeSelect(employee: Employee) {
        setSelectedEmployee(employee);
        setSelectedSlot(null);
        setStep(3);
    }

    function handleDateSelect(value: string) {
        setSelectedDate(value);
        setSelectedSlot(null);
        setSlots([]);
    }

    useEffect(() => {
        if (selectedDate && selectedEmployee && selectedService) {
            fetchSlots();
        }
    }, [selectedDate, selectedEmployee, selectedService]);

    function toggleProduct(productId: number) {
        setSelectedProducts((prev) => {
            if (prev[productId]) {
                const { [productId]: _, ...rest } = prev;

                return rest;
            }

            return { ...prev, [productId]: 1 };
        });
    }

    function updateProductQty(productId: number, qty: number) {
        if (qty <= 0) {
            toggleProduct(productId);

            return;
        }

        setSelectedProducts((prev) => ({ ...prev, [productId]: qty }));
    }

    const allProducts = productCategories.flatMap((c) => c.products);
    const totalService = selectedService ? Number(selectedService.price) : 0;
    const totalProducts = Object.entries(selectedProducts).reduce(
        (sum, [id, qty]) => {
            const found = allProducts.find((p) => p.id === Number(id));

            return sum + (found ? Number(found.price) * qty : 0);
        },
        0,
    );
    const totalAmount = totalService + totalProducts;
    const productCount = Object.values(selectedProducts).reduce(
        (a, b) => a + b,
        0,
    );

    const needsPhone = !!auth.customer && !auth.customer.phone;

    function handleConfirm() {
        if (needsPhone && phone.trim() === '') {
            setError('Agrega tu teléfono para enviarte la confirmación de la cita.');

            return;
        }

        if (auth.customer) {
            submitBooking();
        } else {
            setShouldSubmitAfterAuth(true);
            setStep(6);
        }
    }

    function submitBooking() {
        if (
            !selectedService ||
            !selectedEmployee ||
            !selectedDate ||
            !selectedSlot
        ) {
            return;
        }

        setSubmitting(true);
        setError('');

        const productsPayload = Object.entries(selectedProducts).map(
            ([id, qty]) => ({
                id: Number(id),
                quantity: qty,
            }),
        );

        router.post(
            '/appointments',
            {
                service_id: selectedService.id,
                employee_id: selectedEmployee.id,
                date: selectedDate,
                start_time: selectedSlot.time,
                end_time: selectedSlot.end_time,
                products: productsPayload,
                notes,
                ...(needsPhone ? { phone } : {}),
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    setAppointmentCreated(true);
                },
                onError: (err) => {
                    setSubmitting(false);
                    setError(Object.values(err).join(', '));
                },
            },
        );
    }

    function nextStep() {
        setStep((s) => Math.min(s + 1, 6));
    }

    function prevStep() {
        setStep((s) => Math.max(s - 1, 1));
    }

    function canGoNext(): boolean {
        switch (step) {
            case 1:
                return !!selectedService;
            case 2:
                return !!selectedEmployee;
            case 3:
                return !!selectedDate && !!selectedSlot;
            case 4:
                return true;
            default:
                return false;
        }
    }

    const displayServices = showAllServices ? services : services.slice(0, 5);
    const hasMore = services.length > 5;

    function goToStep(s: number) {
        if (s >= step || appointmentCreated) {
            return;
        }

        setStep(s);
    }

    const quickDates = Array.from({ length: 14 }, (_, i) =>
        toLocalDate(addDays(i)),
    );
    const morningSlots = slots.filter((s) => s.time < '12:00');
    const afternoonSlots = slots.filter((s) => s.time >= '12:00');

    const summary: Array<{
        step: number;
        label: string;
        value: string | null;
    }> = [
        { step: 1, label: 'Servicio', value: selectedService?.name ?? null },
        { step: 2, label: 'Barbero', value: selectedEmployee?.name || null },
        {
            step: 3,
            label: 'Fecha y hora',
            value: selectedSlot
                ? `${formatLongDate(selectedDate)}, ${selectedSlot.time}`
                : null,
        },
        {
            step: 4,
            label: 'Productos',
            value:
                step > 4 || productCount > 0
                    ? productCount > 0
                        ? `${productCount} agregado${productCount > 1 ? 's' : ''}`
                        : 'Ninguno'
                    : null,
        },
    ];

    function choiceClass(selected: boolean): string {
        return `flex w-full cursor-pointer items-center justify-between gap-4 border-l-2 px-4 py-4 text-left transition-colors ${
            selected
                ? 'border-amber-500 bg-stone-800'
                : 'border-transparent hover:bg-stone-800/60'
        }`;
    }

    function slotButtons(list: TimeSlot[]) {
        return (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {list.map((slot) => {
                    const selected = selectedSlot?.time === slot.time;

                    return (
                        <button
                            key={slot.time}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setSelectedSlot(slot)}
                            className={`cursor-pointer rounded-sm border py-2 text-sm tabular-nums transition-colors ${
                                selected
                                    ? 'border-amber-500 bg-amber-500 font-semibold text-stone-950'
                                    : 'border-stone-700 text-stone-200 hover:border-stone-500'
                            }`}
                        >
                            {slot.time}
                        </button>
                    );
                })}
            </div>
        );
    }

    const stepTitle =
        step <= 5
            ? STEP_LABELS[step - 1]
            : appointmentCreated
              ? 'Listo'
              : 'Tus datos';

    return (
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-12">
            {/* Resumen / progreso */}
            <aside className="lg:sticky lg:top-6 lg:self-start">
                <p className="text-sm text-stone-400 lg:hidden">
                    Paso {Math.min(step, 5)} de 5
                </p>
                <div className="mt-2 flex gap-1 lg:hidden" aria-hidden>
                    {STEP_LABELS.map((_, i) => (
                        <span
                            key={i}
                            className={`h-1 flex-1 ${i < step ? 'bg-amber-500' : 'bg-stone-800'}`}
                        />
                    ))}
                </div>

                <div className="hidden lg:block">
                    <p className="font-display text-xl font-semibold tracking-wide uppercase">
                        Tu cita
                    </p>
                    <ol className="mt-4 border-t border-stone-800">
                        {summary.map((row) => {
                            const isCurrent = row.step === step;
                            const editable =
                                row.step < step && !appointmentCreated;

                            return (
                                <li
                                    key={row.step}
                                    className="border-b border-stone-800 py-3"
                                >
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span
                                            className={`text-xs tracking-wider uppercase ${isCurrent ? 'text-amber-500' : 'text-stone-500'}`}
                                        >
                                            {row.label}
                                        </span>
                                        {editable && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    goToStep(row.step)
                                                }
                                                className="cursor-pointer text-xs text-stone-400 underline underline-offset-2 hover:text-stone-100"
                                            >
                                                Cambiar
                                            </button>
                                        )}
                                    </div>
                                    <p
                                        className={`mt-1 text-sm ${row.value ? 'text-stone-100' : 'text-stone-600'}`}
                                    >
                                        {row.value ?? '—'}
                                    </p>
                                </li>
                            );
                        })}
                    </ol>
                    <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-sm text-stone-400">Total</span>
                        <span className="font-display text-3xl font-semibold text-amber-500">
                            {formatPrice(totalAmount)}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Paso actual */}
            <div className="min-w-0">
                <div className="mb-6">
                    {step <= 5 && (
                        <p className="hidden text-sm text-stone-500 lg:block">
                            Paso {step} de 5
                        </p>
                    )}
                    <h3 className="font-display text-3xl font-semibold tracking-wide uppercase">
                        {stepTitle}
                    </h3>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mb-6 border-l-2 border-red-500 bg-red-950/40 px-4 py-3 text-sm text-red-300"
                    >
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <div className="divide-y divide-stone-800 border-y border-stone-800">
                            {displayServices.map((service) => (
                                <button
                                    key={service.id}
                                    type="button"
                                    aria-pressed={
                                        selectedService?.id === service.id
                                    }
                                    onClick={() => handleServiceSelect(service)}
                                    className={choiceClass(
                                        selectedService?.id === service.id,
                                    )}
                                >
                                    <span>
                                        <span className="block font-medium">
                                            {service.name}
                                        </span>
                                        <span className="mt-0.5 block text-sm text-stone-400">
                                            {service.duration_minutes} min
                                            {service.description
                                                ? ` · ${service.description}`
                                                : ''}
                                        </span>
                                    </span>
                                    <span className="shrink-0 font-semibold text-amber-500">
                                        {formatPrice(service.price)}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {hasMore && !showAllServices && (
                            <button
                                type="button"
                                onClick={() => setShowAllServices(true)}
                                className="mt-4 cursor-pointer text-sm text-amber-500 hover:text-amber-400"
                            >
                                Ver los {services.length} servicios
                            </button>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div>
                        {loading && (
                            <p className="text-stone-400">
                                Buscando barberos disponibles…
                            </p>
                        )}
                        {!loading && employees.length === 0 && (
                            <div className="space-y-4">
                                <p className="text-stone-400">
                                    No hay barberos disponibles para este
                                    servicio.
                                </p>
                                <button
                                    type="button"
                                    onClick={fetchEmployees}
                                    className={btnGhost}
                                >
                                    Volver a buscar
                                </button>
                            </div>
                        )}
                        {!loading && employees.length > 0 && (
                            <div className="divide-y divide-stone-800 border-y border-stone-800">
                                {employees.map((emp) => (
                                    <button
                                        key={emp.id}
                                        type="button"
                                        aria-pressed={
                                            selectedEmployee?.id === emp.id
                                        }
                                        onClick={() =>
                                            handleEmployeeSelect(emp)
                                        }
                                        className={choiceClass(
                                            selectedEmployee?.id === emp.id,
                                        )}
                                    >
                                        <span className="font-medium">
                                            {emp.name}
                                        </span>
                                        <span className="text-sm text-stone-500">
                                            Elegir
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8">
                        <p className="text-sm text-stone-400">
                            {selectedService?.name} con {selectedEmployee?.name}
                        </p>

                        <div>
                            <p className="mb-3 text-sm text-stone-300">Día</p>
                            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
                                {quickDates.map((value, i) => {
                                    const [, m, d] = value
                                        .split('-')
                                        .map(Number);
                                    const dow = addDays(i).getDay();
                                    const selected = selectedDate === value;

                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() =>
                                                handleDateSelect(value)
                                            }
                                            className={`w-16 shrink-0 cursor-pointer rounded-sm border py-2 text-center transition-colors ${
                                                selected
                                                    ? 'border-amber-500 bg-amber-500 text-stone-950'
                                                    : 'border-stone-700 hover:border-stone-500'
                                            }`}
                                        >
                                            <span
                                                className={`block text-xs ${selected ? 'text-stone-900' : 'text-stone-500'}`}
                                            >
                                                {i === 0
                                                    ? 'Hoy'
                                                    : DAY_SHORT[dow]}
                                            </span>
                                            <span className="block text-lg font-semibold tabular-nums">
                                                {d}
                                            </span>
                                            <span
                                                className={`block text-xs ${selected ? 'text-stone-900' : 'text-stone-500'}`}
                                            >
                                                {MONTH_SHORT[m - 1]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <label className="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-400">
                                Otra fecha
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) =>
                                        handleDateSelect(e.target.value)
                                    }
                                    min={toLocalDate(new Date())}
                                    max={toLocalDate(addDays(60))}
                                    className={`${inputClass} max-w-48 [color-scheme:dark]`}
                                />
                            </label>
                        </div>

                        {selectedDate && (
                            <div>
                                <p className="mb-3 text-sm text-stone-300">
                                    Hora — {formatLongDate(selectedDate)}
                                </p>
                                {loading ? (
                                    <p className="text-stone-400">
                                        Cargando horarios…
                                    </p>
                                ) : slots.length === 0 ? (
                                    <div className="space-y-4">
                                        <p className="text-stone-400">
                                            {selectedEmployee?.name} no tiene
                                            horarios libres ese día.
                                        </p>
                                        {alternativeEmployees.length > 0 && (
                                            <div>
                                                <p className="text-sm text-stone-300">
                                                    Disponibles ese día:
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {alternativeEmployees.map(
                                                        (emp) => (
                                                            <button
                                                                key={emp.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedEmployee(
                                                                        emp,
                                                                    );
                                                                    setSelectedSlot(
                                                                        null,
                                                                    );
                                                                    setSlots(
                                                                        [],
                                                                    );
                                                                    setAlternativeEmployees(
                                                                        [],
                                                                    );
                                                                }}
                                                                className={
                                                                    btnGhost
                                                                }
                                                            >
                                                                {emp.name}
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {morningSlots.length > 0 && (
                                            <div>
                                                <p className="mb-2 text-xs tracking-wider text-stone-500 uppercase">
                                                    Mañana
                                                </p>
                                                {slotButtons(morningSlots)}
                                            </div>
                                        )}
                                        {afternoonSlots.length > 0 && (
                                            <div>
                                                <p className="mb-2 text-xs tracking-wider text-stone-500 uppercase">
                                                    Tarde
                                                </p>
                                                {slotButtons(afternoonSlots)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-8">
                        <p className="text-sm text-stone-400">
                            Opcional. Se suman al total de tu cita.
                        </p>
                        {productCategories.length === 0 ? (
                            <p className="text-stone-400">
                                No hay productos disponibles.
                            </p>
                        ) : (
                            productCategories.map((cat) => (
                                <div key={cat.id}>
                                    <p className="mb-2 text-xs tracking-wider text-stone-500 uppercase">
                                        {cat.name}
                                    </p>
                                    <ul className="divide-y divide-stone-800 border-y border-stone-800">
                                        {cat.products.map((product) => {
                                            const qty =
                                                selectedProducts[product.id];

                                            return (
                                                <li
                                                    key={product.id}
                                                    className={`flex items-center justify-between gap-4 border-l-2 px-4 py-3 ${qty ? 'border-amber-500 bg-stone-800' : 'border-transparent'}`}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-medium">
                                                            {product.name}
                                                        </p>
                                                        <p className="text-sm text-stone-400">
                                                            {formatPrice(
                                                                product.price,
                                                            )}
                                                            {product.stock <=
                                                                5 && (
                                                                <span className="text-stone-500">
                                                                    {' '}
                                                                    · quedan{' '}
                                                                    {
                                                                        product.stock
                                                                    }
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    {qty ? (
                                                        <div className="flex shrink-0 items-center border border-stone-600">
                                                            <button
                                                                type="button"
                                                                aria-label={`Quitar uno de ${product.name}`}
                                                                onClick={() =>
                                                                    updateProductQty(
                                                                        product.id,
                                                                        qty - 1,
                                                                    )
                                                                }
                                                                className="h-9 w-9 cursor-pointer text-stone-300 hover:bg-stone-700"
                                                            >
                                                                −
                                                            </button>
                                                            <span className="w-8 text-center text-sm tabular-nums">
                                                                {qty}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                aria-label={`Agregar uno de ${product.name}`}
                                                                onClick={() =>
                                                                    updateProductQty(
                                                                        product.id,
                                                                        qty + 1,
                                                                    )
                                                                }
                                                                disabled={
                                                                    qty >=
                                                                    product.stock
                                                                }
                                                                className="h-9 w-9 cursor-pointer text-stone-300 hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleProduct(
                                                                    product.id,
                                                                )
                                                            }
                                                            className="shrink-0 cursor-pointer text-sm font-medium text-amber-500 hover:text-amber-400"
                                                        >
                                                            Agregar
                                                        </button>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6">
                        <dl className="divide-y divide-stone-800 border-y border-stone-800 text-sm">
                            {[
                                ['Servicio', selectedService?.name],
                                ['Barbero', selectedEmployee?.name],
                                ['Fecha', formatLongDate(selectedDate)],
                                ['Hora', selectedSlot?.display],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex justify-between gap-4 py-3"
                                >
                                    <dt className="text-stone-400">{label}</dt>
                                    <dd className="text-right">{value}</dd>
                                </div>
                            ))}
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="text-stone-400">Servicio</dt>
                                <dd className="tabular-nums">
                                    {formatPrice(totalService)}
                                </dd>
                            </div>
                            {totalProducts > 0 && (
                                <div className="flex justify-between gap-4 py-3">
                                    <dt className="text-stone-400">
                                        Productos
                                    </dt>
                                    <dd className="tabular-nums">
                                        {formatPrice(totalProducts)}
                                    </dd>
                                </div>
                            )}
                            <div className="flex items-baseline justify-between gap-4 py-4">
                                <dt className="font-medium">Total</dt>
                                <dd className="font-display text-3xl font-semibold text-amber-500">
                                    {formatPrice(totalAmount)}
                                </dd>
                            </div>
                        </dl>

                        <label className="block">
                            <span className="mb-1.5 block text-sm text-stone-300">
                                Notas para el barbero (opcional)
                            </span>
                            <textarea
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className={`${inputClass} min-h-[80px]`}
                                placeholder="Por ejemplo: degradado bajo, sin navaja"
                            />
                        </label>

                        {needsPhone && (
                            <div>
                                <Field
                                    label="Teléfono (WhatsApp)"
                                    type="tel"
                                    autoComplete="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+52 555 123 4567"
                                />
                                <p className="mt-1.5 text-xs text-stone-500">
                                    Ahí te enviamos la confirmación y el
                                    recordatorio de la cita.
                                </p>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={submitting}
                            className={`${btnPrimary} w-full py-3 text-base sm:w-auto sm:px-10`}
                        >
                            {submitting ? 'Agendando…' : 'Confirmar cita'}
                        </button>
                    </div>
                )}

                {step === 6 && !appointmentCreated && !auth.customer && (
                    <div className="max-w-md space-y-6">
                        <p className="text-sm text-stone-400">
                            Inicia sesión o crea una cuenta para guardar tu
                            cita. Tu selección no se pierde.
                        </p>

                        <div
                            className="flex gap-6 border-b border-stone-800"
                            role="tablist"
                        >
                            {(
                                [
                                    ['login', 'Ya tengo cuenta'],
                                    ['register', 'Soy nuevo'],
                                ] as const
                            ).map(([tab, label]) => (
                                <button
                                    key={tab}
                                    type="button"
                                    role="tab"
                                    aria-selected={authTab === tab}
                                    onClick={() => setAuthTab(tab)}
                                    className={`-mb-px cursor-pointer border-b-2 pb-3 text-sm font-medium transition-colors ${
                                        authTab === tab
                                            ? 'border-amber-500 text-stone-100'
                                            : 'border-transparent text-stone-500 hover:text-stone-300'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {authTab === 'login' && (
                            <form
                                className="space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setLoginErrors({});
                                    router.post(
                                        '/cliente/login',
                                        { ...loginForm },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                            onError: (err) =>
                                                setLoginErrors(err),
                                        },
                                    );
                                }}
                            >
                                <Field
                                    label="Correo electrónico"
                                    type="email"
                                    autoComplete="email"
                                    value={loginForm.email}
                                    onChange={(e) =>
                                        setLoginForm({
                                            ...loginForm,
                                            email: e.target.value,
                                        })
                                    }
                                    error={loginErrors.email}
                                />
                                <Field
                                    label="Contraseña"
                                    type="password"
                                    autoComplete="current-password"
                                    value={loginForm.password}
                                    onChange={(e) =>
                                        setLoginForm({
                                            ...loginForm,
                                            password: e.target.value,
                                        })
                                    }
                                    error={loginErrors.password}
                                />
                                {loginErrors.error && (
                                    <p className="text-sm text-red-400">
                                        {loginErrors.error}
                                    </p>
                                )}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`${btnPrimary} w-full`}
                                >
                                    Entrar y agendar
                                </button>
                            </form>
                        )}

                        {authTab === 'register' && (
                            <form
                                className="space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setRegisterErrors({});
                                    router.post(
                                        '/cliente/register',
                                        { ...registerForm },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                            onError: (err) =>
                                                setRegisterErrors(err),
                                        },
                                    );
                                }}
                            >
                                <Field
                                    label="Nombre"
                                    autoComplete="name"
                                    value={registerForm.name}
                                    onChange={(e) =>
                                        setRegisterForm({
                                            ...registerForm,
                                            name: e.target.value,
                                        })
                                    }
                                    error={registerErrors.name}
                                />
                                <Field
                                    label="Correo electrónico"
                                    type="email"
                                    autoComplete="email"
                                    value={registerForm.email}
                                    onChange={(e) =>
                                        setRegisterForm({
                                            ...registerForm,
                                            email: e.target.value,
                                        })
                                    }
                                    error={registerErrors.email}
                                />
                                <Field
                                    label="Teléfono (WhatsApp)"
                                    type="tel"
                                    autoComplete="tel"
                                    required
                                    value={registerForm.phone}
                                    onChange={(e) =>
                                        setRegisterForm({
                                            ...registerForm,
                                            phone: e.target.value,
                                        })
                                    }
                                    error={registerErrors.phone}
                                    placeholder="+52 555 123 4567"
                                />
                                <Field
                                    label="Contraseña"
                                    type="password"
                                    autoComplete="new-password"
                                    value={registerForm.password}
                                    onChange={(e) =>
                                        setRegisterForm({
                                            ...registerForm,
                                            password: e.target.value,
                                        })
                                    }
                                    error={registerErrors.password}
                                    placeholder="Mínimo 8 caracteres"
                                />
                                <Field
                                    label="Confirmar contraseña"
                                    type="password"
                                    autoComplete="new-password"
                                    value={registerForm.password_confirmation}
                                    onChange={(e) =>
                                        setRegisterForm({
                                            ...registerForm,
                                            password_confirmation:
                                                e.target.value,
                                        })
                                    }
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`${btnPrimary} w-full`}
                                >
                                    Crear cuenta y agendar
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {step === 6 && appointmentCreated && (
                    <div className="max-w-md space-y-4">
                        <p className="text-stone-300">
                            Tu cita con {selectedEmployee?.name} quedó agendada
                            para el {formatLongDate(selectedDate)} a las{' '}
                            {selectedSlot?.time}.
                        </p>
                        <Link href="/mi-cuenta" className={btnPrimary}>
                            Ver mis citas
                        </Link>
                    </div>
                )}

                {step === 6 && auth.customer && !appointmentCreated && (
                    <p className="text-stone-400">Agendando tu cita…</p>
                )}

                {/* Navegación */}
                {step <= 5 && !appointmentCreated && (
                    <div className="mt-10 flex items-center justify-between border-t border-stone-800 pt-6">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="cursor-pointer text-sm text-stone-400 hover:text-stone-100"
                            >
                                ← Atrás
                            </button>
                        ) : (
                            <span />
                        )}

                        {step < 5 && (
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={!canGoNext() || loading}
                                className={btnPrimary}
                            >
                                Continuar
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
