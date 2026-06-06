import { usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

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

const STEP_LABELS = ['Servicio', 'Barbero', 'Fecha y Hora', 'Productos', 'Confirmar', 'Cuenta'];

export default function BookingWizard({ services, productCategories, initialServiceId, initialEmployeeId }: Props) {
    const { auth } = usePage().props;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showAllServices, setShowAllServices] = useState(false);

    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Record<number, number>>({});
    const [notes, setNotes] = useState('');
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
    const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
    const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
    const [shouldSubmitAfterAuth, setShouldSubmitAfterAuth] = useState(false);
    const [appointmentCreated, setAppointmentCreated] = useState(false);

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [alternativeEmployees, setAlternativeEmployees] = useState<Employee[]>([]);

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
        if (step === 2 && selectedService && employees.length === 0 && !loading) {
            fetchEmployees();
        }
    }, [step, selectedService]);

    useEffect(() => {
        if (auth.customer && shouldSubmitAfterAuth && step === 6 && !appointmentCreated) {
            submitBooking();
        }
    }, [auth.customer, shouldSubmitAfterAuth, step, appointmentCreated]);

    async function fetchEmployees() {
        if (!selectedService) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/employees?service_id=${selectedService.id}`);
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
        if (!selectedEmployee || !selectedDate || !selectedService) return;
        setLoading(true);
        setError('');
        setAlternativeEmployees([]);
        try {
            const res = await fetch(`/api/slots?employee_id=${selectedEmployee.id}&date=${selectedDate}&service_id=${selectedService.id}`);
            const data = await res.json();
            setSlots(data);
            setSelectedSlot(null);

            if (data.length === 0) {
                const altRes = await fetch(`/api/employees-availability?date=${selectedDate}&service_id=${selectedService.id}&exclude_employee_id=${selectedEmployee.id}`);
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

    function handleDateSelect(e: React.ChangeEvent<HTMLInputElement>) {
        setSelectedDate(e.target.value);
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

    const totalService = selectedService ? Number(selectedService.price) : 0;
    const totalProducts = Object.entries(selectedProducts).reduce((sum, [id, qty]) => {
        const found = productCategories
            .flatMap((c) => c.products)
            .find((p) => p.id === Number(id));
        return sum + (found ? Number(found.price) * qty : 0);
    }, 0);
    const totalAmount = totalService + totalProducts;

    function handleConfirm() {
        if (auth.customer) {
            submitBooking();
        } else {
            setShouldSubmitAfterAuth(true);
            setStep(6);
        }
    }

    function submitBooking() {
        if (!selectedService || !selectedEmployee || !selectedDate || !selectedSlot) return;
        setSubmitting(true);
        setError('');

        const productsPayload = Object.entries(selectedProducts).map(([id, qty]) => ({
            id: Number(id),
            quantity: qty,
        }));

        router.post('/appointments', {
            service_id: selectedService.id,
            employee_id: selectedEmployee.id,
            date: selectedDate,
            start_time: selectedSlot.time,
            end_time: selectedSlot.end_time,
            products: productsPayload,
            notes,
        }, {
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
        });
    }

    function nextStep() {
        setStep((s) => Math.min(s + 1, 6));
    }

    function prevStep() {
        setStep((s) => Math.max(s - 1, 1));
    }

    function getMinDate(): string {
        return new Date().toISOString().split('T')[0];
    }

    function getMaxDate(): string {
        const d = new Date();
        d.setDate(d.getDate() + 60);
        return d.toISOString().split('T')[0];
    }

    function canGoNext(): boolean {
        switch (step) {
            case 1: return !!selectedService;
            case 2: return !!selectedEmployee;
            case 3: return !!selectedDate && !!selectedSlot;
            case 4: return true;
            default: return false;
        }
    }

    const displayServices = showAllServices ? services : services.slice(0, 5);
    const hasMore = services.length > 5;

    function renderStepIndicator() {
        return (
            <div className="flex items-center justify-center gap-1 sm:gap-2">
                {STEP_LABELS.map((label, i) => {
                    const s = i + 1;
                    return (
                        <div key={s} className="flex items-center gap-1 sm:gap-2">
                            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-colors ${
                                s === step
                                    ? 'bg-amber-500 text-stone-900'
                                    : s < step
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-stone-800 text-stone-500'
                            }`}>
                                {s < step ? (
                                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    s
                                )}
                            </div>
                            <span className={`hidden sm:block text-xs ${
                                s === step ? 'text-amber-400 font-medium' : s < step ? 'text-amber-400/70' : 'text-stone-500'
                            }`}>
                                {label}
                            </span>
                            {s < 6 && (
                                <div className={`hidden sm:block h-px w-4 md:w-8 ${s < step ? 'bg-amber-500/40' : 'bg-stone-800'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {renderStepIndicator()}

            {error && (
                <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400 border border-red-900/30">
                    {error}
                </div>
            )}

            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-4 sm:p-6">
                {/* Step 1: Service */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-stone-100">¿Qué servicio deseas?</h2>
                        <p className="text-sm text-stone-400">Elige el servicio que necesitas</p>
                        <div className="grid gap-3">
                            {displayServices.map((service) => (
                                <div
                                    key={service.id}
                                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                                        selectedService?.id === service.id
                                            ? 'border-amber-500 bg-amber-500/5'
                                            : 'border-stone-700 hover:border-amber-500/50'
                                    }`}
                                    onClick={() => handleServiceSelect(service)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-stone-100">{service.name}</h3>
                                            {service.description && (
                                                <p className="mt-1 text-sm text-stone-400">{service.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-amber-400">${Number(service.price).toFixed(2)}</p>
                                            <p className="text-sm text-stone-500">{service.duration_minutes} min</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {hasMore && !showAllServices && (
                            <button
                                onClick={() => setShowAllServices(true)}
                                className="w-full rounded-lg border border-stone-700 py-2.5 text-sm font-medium text-amber-400 hover:bg-stone-800 transition-colors"
                            >
                                Ver todos los servicios ({services.length})
                            </button>
                        )}
                    </div>
                )}

                {/* Step 2: Employee */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-stone-100">Elige tu profesional</h2>
                        <p className="text-sm text-stone-400">Selecciona quién te atenderá</p>
                        {employees.length === 0 && !loading && (
                            <button
                                onClick={fetchEmployees}
                                className="rounded-lg bg-amber-500 px-6 py-2 text-sm font-medium text-stone-900 hover:bg-amber-400 transition-colors"
                            >
                                Buscar profesionales disponibles
                            </button>
                        )}
                        {loading && (
                            <p className="text-stone-400">Buscando profesionales...</p>
                        )}
                        {!loading && employees.length === 0 && (
                            <p className="text-stone-400">No hay empleados disponibles para este servicio hoy.</p>
                        )}
                        {!loading && employees.length > 0 && (
                            <div className="grid gap-3">
                                {employees.map((emp) => (
                                    <div
                                        key={emp.id}
                                        className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                                            selectedEmployee?.id === emp.id
                                                ? 'border-amber-500 bg-amber-500/5'
                                                : 'border-stone-700 hover:border-amber-500/50'
                                        }`}
                                        onClick={() => handleEmployeeSelect(emp)}
                                    >
                                        <h3 className="font-medium text-stone-100">{emp.name}</h3>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Date + Time */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-stone-100">Fecha y horario</h2>
                            <p className="mt-1 text-sm text-stone-400">
                                {selectedService?.name} con {selectedEmployee?.name}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-300">Selecciona la fecha</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateSelect}
                                min={getMinDate()}
                                max={getMaxDate()}
                                className="block w-full max-w-xs rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>

                        {selectedDate && (
                            <div className="space-y-3">
                                <p className="text-sm text-stone-400">
                                    {selectedEmployee?.name} — {selectedDate}
                                </p>
                                {loading ? (
                                    <p className="text-stone-400">Cargando horarios...</p>
                                ) : slots.length === 0 ? (
                                    <div className="space-y-3">
                                        <p className="text-stone-400">No hay horarios disponibles para esta fecha con {selectedEmployee?.name}.</p>
                                        {alternativeEmployees.length > 0 && (
                                            <div className="rounded-lg border border-stone-700 p-4 space-y-3">
                                                <p className="text-sm font-medium text-stone-300">Otros barberos disponibles ese día:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {alternativeEmployees.map((emp) => (
                                                        <button
                                                            key={emp.id}
                                                            onClick={() => {
                                                                setSelectedEmployee(emp);
                                                                setSelectedSlot(null);
                                                                setSlots([]);
                                                                setAlternativeEmployees([]);
                                                            }}
                                                            className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                                                        >
                                                            {emp.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                        {slots.map((slot) => (
                                            <div
                                                key={slot.time}
                                                className={`cursor-pointer rounded-lg border p-3 text-center transition-colors ${
                                                    selectedSlot?.time === slot.time
                                                        ? 'border-amber-500 bg-amber-500/5 font-medium text-amber-400'
                                                        : 'border-stone-700 text-stone-300 hover:border-amber-500/50'
                                                }`}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                {slot.display}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Products */}
                {step === 4 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-stone-100">Productos recomendados</h2>
                        <p className="text-sm text-stone-400">Agrega productos a tu cita (opcional)</p>
                        {productCategories.length === 0 ? (
                            <p className="text-stone-400">No hay productos disponibles.</p>
                        ) : (
                            productCategories.map((cat) => (
                                <div key={cat.id} className="space-y-2">
                                    <h3 className="text-sm font-medium text-stone-500">{cat.name}</h3>
                                    <div className="grid gap-2">
                                        {cat.products.map((product) => (
                                            <div
                                                key={product.id}
                                                className={`rounded-lg border p-3 transition-colors ${
                                                    selectedProducts[product.id]
                                                        ? 'border-amber-500 bg-amber-500/5'
                                                        : 'border-stone-700'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-stone-100">{product.name}</p>
                                                        <p className="text-sm text-stone-400">
                                                            ${Number(product.price).toFixed(2)} — Stock: {product.stock}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {selectedProducts[product.id] ? (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateProductQty(product.id, selectedProducts[product.id] - 1)}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-600 text-stone-300 hover:bg-stone-700"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="w-8 text-center text-sm text-stone-100">{selectedProducts[product.id]}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateProductQty(product.id, selectedProducts[product.id] + 1)}
                                                                    disabled={selectedProducts[product.id] >= product.stock}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-600 text-stone-300 hover:bg-stone-700 disabled:opacity-40"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleProduct(product.id)}
                                                                className="rounded-md border border-stone-600 px-3 py-1.5 text-sm text-stone-300 hover:bg-stone-700"
                                                            >
                                                                Agregar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Step 5: Confirm */}
                {step === 5 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-stone-100">Confirmar cita</h2>

                        <div className="rounded-lg border border-stone-700 p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-stone-400">Servicio</span>
                                <span className="font-medium text-stone-100">{selectedService?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-400">Profesional</span>
                                <span className="font-medium text-stone-100">{selectedEmployee?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-400">Fecha</span>
                                <span className="font-medium text-stone-100">{selectedDate}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-400">Horario</span>
                                <span className="font-medium text-stone-100">{selectedSlot?.display}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-400">Servicio</span>
                                <span className="font-medium text-stone-100">${totalService.toFixed(2)}</span>
                            </div>
                            {totalProducts > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-stone-400">Productos</span>
                                    <span className="font-medium text-stone-100">${totalProducts.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-stone-700 pt-2">
                                <span className="font-semibold text-stone-100">Total</span>
                                <span className="font-semibold text-amber-400">${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-stone-300">Notas (opcional)</label>
                            <textarea
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="min-h-[80px] w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                placeholder="Alguna observación para tu cita..."
                            />
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={submitting}
                            className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-stone-900 hover:bg-amber-400 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? 'Confirmando...' : 'Confirmar y Agendar'}
                        </button>
                    </div>
                )}

                {/* Step 6: Auth (shown after confirm if not logged in) */}
                {step === 6 && !appointmentCreated && !auth.customer && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-stone-100">Crea tu cuenta o inicia sesión</h2>
                            <p className="mt-1 text-sm text-stone-400">
                                Necesitamos tus datos para agendar la cita. Tus datos están seguros.
                            </p>
                        </div>

                        <div className="flex rounded-lg border border-stone-700">
                            <button
                                onClick={() => setAuthTab('login')}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-l-lg transition-colors ${
                                    authTab === 'login'
                                        ? 'bg-amber-500 text-stone-900'
                                        : 'text-stone-400 hover:text-stone-100'
                                }`}
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                onClick={() => setAuthTab('register')}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-r-lg transition-colors ${
                                    authTab === 'register'
                                        ? 'bg-amber-500 text-stone-900'
                                        : 'text-stone-400 hover:text-stone-100'
                                }`}
                            >
                                Crear Cuenta
                            </button>
                        </div>

                        {authTab === 'login' && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium text-stone-300">Correo electrónico</label>
                                    <input
                                        type="email"
                                        value={loginForm.email}
                                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                        className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                        placeholder="tu@correo.com"
                                    />
                                    {loginErrors.email && <p className="text-sm text-red-400">{loginErrors.email}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium text-stone-300">Contraseña</label>
                                    <input
                                        type="password"
                                        value={loginForm.password}
                                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                        className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                        placeholder="Tu contraseña"
                                    />
                                    {loginErrors.password && <p className="text-sm text-red-400">{loginErrors.password}</p>}
                                </div>
                                {loginErrors.error && <p className="text-sm text-red-400">{loginErrors.error}</p>}
                                <button
                                    onClick={() => {
                                        setLoginErrors({});
                                        router.post('/cliente/login', { ...loginForm }, {
                                            preserveState: true,
                                            preserveScroll: true,
                                            onError: (err) => setLoginErrors(err),
                                        });
                                    }}
                                    disabled={submitting}
                                    className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-stone-900 hover:bg-amber-400 disabled:opacity-50 transition-colors"
                                >
                                    Iniciar Sesión
                                </button>
                            </div>
                        )}

                        {authTab === 'register' && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium text-stone-300">Nombre</label>
                                    <input
                                        type="text"
                                        value={registerForm.name}
                                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                                        className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                        placeholder="Tu nombre"
                                    />
                                    {registerErrors.name && <p className="text-sm text-red-400">{registerErrors.name}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium text-stone-300">Correo electrónico</label>
                                    <input
                                        type="email"
                                        value={registerForm.email}
                                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                        className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                        placeholder="tu@correo.com"
                                    />
                                    {registerErrors.email && <p className="text-sm text-red-400">{registerErrors.email}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium text-stone-300">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={registerForm.phone}
                                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                                        className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                        placeholder="+52 555 123 4567"
                                    />
                                    {registerErrors.phone && <p className="text-sm text-red-400">{registerErrors.phone}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium text-stone-300">Contraseña</label>
                                    <input
                                        type="password"
                                        value={registerForm.password}
                                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                        className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                        placeholder="Mínimo 8 caracteres"
                                    />
                                    {registerErrors.password && <p className="text-sm text-red-400">{registerErrors.password}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium text-stone-300">Confirmar contraseña</label>
                                    <input
                                        type="password"
                                        value={registerForm.password_confirmation}
                                        onChange={(e) => setRegisterForm({ ...registerForm, password_confirmation: e.target.value })}
                                        className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                        placeholder="Repite la contraseña"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setRegisterErrors({});
                                        router.post('/cliente/register', { ...registerForm }, {
                                            preserveState: true,
                                            preserveScroll: true,
                                            onError: (err) => setRegisterErrors(err),
                                        });
                                    }}
                                    disabled={submitting}
                                    className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-stone-900 hover:bg-amber-400 disabled:opacity-50 transition-colors"
                                >
                                    Crear Cuenta
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 6: Success (after auth + booking created) */}
                {step === 6 && appointmentCreated && (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                                <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-stone-100">¡Cita agendada!</h2>
                        <p className="text-stone-400">
                            Tu cita con {selectedEmployee?.name} para {selectedDate} a las {selectedSlot?.display} ha sido confirmada.
                        </p>
                        <p className="text-sm text-stone-500">Recibirás un recordatorio en tu correo.</p>
                    </div>
                )}

                {/* Step 6: Submitting for logged-in user */}
                {step === 6 && auth.customer && !appointmentCreated && (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                                <svg className="h-8 w-8 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            </div>
                        </div>
                        <p className="text-stone-400">Agendando tu cita...</p>
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between">
                    {step > 1 && !appointmentCreated && step < 6 ? (
                        <button
                            onClick={prevStep}
                            className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-800 transition-colors"
                        >
                            Atrás
                        </button>
                    ) : step === 6 && appointmentCreated ? (
                        <div />
                    ) : (
                        <div />
                    )}

                    {step < 5 && !appointmentCreated && (
                        <button
                            onClick={nextStep}
                            disabled={!canGoNext() || loading}
                            className="rounded-lg bg-amber-500 px-6 py-2 text-sm font-medium text-stone-900 hover:bg-amber-400 disabled:opacity-50 transition-colors"
                        >
                            Siguiente
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
