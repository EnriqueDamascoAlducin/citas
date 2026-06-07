import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { dashboard } from '@/routes/admin';
import { Scissors, Clock, MapPin, Calendar, Star } from 'lucide-react';
import BookingWizard from '@/components/booking-wizard';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

type Service = {
    id: number;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: string | number;
};

type ScheduleSlot = {
    start_time: string;
    end_time: string;
};

type Employee = {
    id: number;
    name: string;
    schedules: Record<string, ScheduleSlot[]>;
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

export default function Welcome() {
    const { auth, services, employees, productCategories, heroImage, logoImage } = usePage().props as {
        auth: any;
        services: Service[];
        employees: Employee[];
        productCategories: ProductCategory[];
        heroImage: string;
        logoImage: string;
    };

    const [preSelectedServiceId, setPreSelectedServiceId] = useState<number | undefined>(
        () => {
            const p = new URLSearchParams(window.location.search);
            const v = p.get('service_id');
            return v ? Number(v) : undefined;
        }
    );
    const [preSelectedEmployeeId, setPreSelectedEmployeeId] = useState<number | undefined>(
        () => {
            const p = new URLSearchParams(window.location.search);
            const v = p.get('employee_id');
            return v ? Number(v) : undefined;
        }
    );

    const scrollToBooking = useCallback(() => {
        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    function handlePreselectService(serviceId: number) {
        setPreSelectedServiceId(serviceId);
        setPreSelectedEmployeeId(undefined);
        setTimeout(scrollToBooking, 50);
    }

    function handlePreselectEmployee(employeeId: number) {
        setPreSelectedEmployeeId(employeeId);
        setPreSelectedServiceId(undefined);
        setTimeout(scrollToBooking, 50);
    }

    function handlePreselectBoth(serviceId: number, employeeId: number) {
        setPreSelectedServiceId(serviceId);
        setPreSelectedEmployeeId(employeeId);
        setTimeout(scrollToBooking, 50);
    }

    return (
        <>
            <Head title="Barbería" />

            <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-stone-100">
                <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
                />

                <header className="relative z-20 flex items-center justify-between px-6 py-4 lg:px-12">
                    <div className="flex items-center gap-2">
                        <img src={logoImage} alt="BarberShop" className="h-10 w-auto" />
                    </div>
                    <nav className="flex items-center gap-6">
                        <a href="#services" className="text-sm text-stone-400 hover:text-amber-400 transition-colors">Servicios</a>
                        <a href="#employees" className="text-sm text-stone-400 hover:text-amber-400 transition-colors">Barberos</a>
                        <button onClick={scrollToBooking} className="text-sm text-stone-400 hover:text-amber-400 transition-colors cursor-pointer">Agendar</button>
                        {auth.user ? (
                            <Link href={dashboard()} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-400 transition-colors">
                                Dashboard
                            </Link>
                        ) : auth.customer ? (
                            <Link href="/mi-cuenta" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-400 transition-colors">
                                Hola, {auth.customer.name.split(' ')[0]}
                            </Link>
                        ) : (
                            <>
                                <Link href="/cliente/login" className="text-sm text-stone-400 hover:text-amber-400 transition-colors">Iniciar Sesión</Link>
                                <Link href="/cliente/register" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-400 transition-colors">
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <section className="relative flex flex-col items-center justify-center px-6 py-24 text-center lg:px-12 lg:py-36 overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110" style={{ backgroundImage: `url('${heroImage}')` }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/70 to-stone-950/85" />
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-950/20 via-transparent to-amber-950/20" />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs text-amber-400/80 mb-8">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            Barbería profesional desde 2024
                        </div>
                        <h1 className="max-w-3xl text-4xl font-bold tracking-tight lg:text-6xl">
                            Estilo clásico, <span className="text-amber-400">corte perfecto</span>
                        </h1>
                        <p className="mt-4 max-w-xl text-lg text-stone-400 mx-auto">
                            Barbería tradicional con los mejores profesionales. Cortes modernos y clásicos, barba, y productos de cuidado personal.
                        </p>
                        <div className="mt-8 flex gap-4 justify-center">
                            <button onClick={scrollToBooking} className="rounded-lg bg-amber-500 px-6 py-3 font-medium text-stone-900 hover:bg-amber-400 transition-all hover:shadow-lg hover:shadow-amber-500/20 cursor-pointer">
                                Agendar Cita
                            </button>
                            <a href="#services" className="rounded-lg border border-stone-700 px-6 py-3 font-medium text-stone-300 hover:bg-stone-800 transition-colors">
                                Ver Servicios
                            </a>
                        </div>
                        <div className="mt-16 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
                            {[
                                { icon: Scissors, label: 'Profesionales', value: `${(employees as Employee[]).length} barberos` },
                                { icon: Clock, label: 'Horario', value: 'Lun-Sáb 9:00-18:00' },
                                { icon: MapPin, label: 'Ubicación', value: 'Tu ciudad' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-900/60 p-4 backdrop-blur-sm hover:border-stone-700 transition-colors">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                        <item.icon className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-stone-500">{item.label}</p>
                                        <p className="font-medium">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {services.length > 0 && (
                    <section id="services" className="relative px-6 py-20 lg:px-12">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                        <div className="mx-auto max-w-5xl">
                            <div className="text-center">
                                <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/70">Nuestros servicios</p>
                                <h2 className="mt-2 text-3xl font-bold">Elige lo que necesitas</h2>
                                <p className="mt-2 text-stone-400">Cortes modernos, clásicos y más</p>
                            </div>
                            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {(services as Service[]).map((service) => (
                                    <div key={service.id} className="group rounded-xl border border-stone-800 bg-stone-900/40 p-5 transition-all hover:border-amber-500/30 hover:bg-stone-900/80 hover:shadow-lg hover:shadow-amber-500/5">
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-semibold group-hover:text-amber-400 transition-colors">{service.name}</h3>
                                            <span className="text-lg font-bold text-amber-400">${Number(service.price).toFixed(2)}</span>
                                        </div>
                                        {service.description && (
                                            <p className="mt-2 text-sm text-stone-500">{service.description}</p>
                                        )}
                                        <div className="mt-4 flex items-center gap-1.5 text-xs text-stone-600">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>{service.duration_minutes} min</span>
                                        </div>
                                        <button
                                            onClick={() => handlePreselectService(service.id)}
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-stone-700 py-2 text-sm font-medium text-stone-400 transition-all hover:bg-amber-500 hover:text-stone-900 hover:border-amber-500 cursor-pointer"
                                        >
                                            <Calendar className="h-4 w-4" />
                                            Agendar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {employees.length > 0 && (
                    <section id="employees" className="relative px-6 py-20 lg:px-12">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />
                        <div className="mx-auto max-w-5xl">
                            <div className="text-center">
                                <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/70">Nuestro equipo</p>
                                <h2 className="mt-2 text-3xl font-bold">Barberos expertos</h2>
                                <p className="mt-2 text-stone-400">Conoce sus horarios y agenda con ellos</p>
                            </div>
                            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {(employees as Employee[]).map((employee) => (
                                    <div key={employee.id} className="group rounded-xl border border-stone-800 bg-stone-900/40 p-5 transition-all hover:border-amber-500/30 hover:bg-stone-900/80 hover:shadow-lg hover:shadow-amber-500/5">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400">
                                                <Scissors className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold group-hover:text-amber-400 transition-colors">{employee.name}</h3>
                                                <p className="text-xs text-stone-500">Barbero</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            {Array.from({ length: 6 }, (_, i) => i + 1).map((day) => {
                                                const slots = employee.schedules[String(day)] ?? [];
                                                return (
                                                    <div key={day} className="flex items-center justify-between text-sm">
                                                        <span className="w-20 text-stone-500">{DAY_NAMES[day]}</span>
                                                        <span className={slots.length > 0 ? 'text-stone-400' : 'text-stone-700'}>
                                                            {slots.length > 0
                                                                ? slots.map((s) => `${s.start_time}-${s.end_time}`).join(', ')
                                                                : '—'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-4">
                                            <button
                                                onClick={() => handlePreselectEmployee(employee.id)}
                                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-700 py-2 text-sm font-medium text-stone-400 transition-all hover:bg-amber-500 hover:text-stone-900 hover:border-amber-500 cursor-pointer"
                                            >
                                                <Calendar className="h-4 w-4" />
                                                Agendar con {employee.name.split(' ')[0]}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <section id="booking" className="relative px-6 py-20 lg:px-12">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                    <div className="mx-auto max-w-3xl">
                        <div className="text-center">
                            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/70">Reserva</p>
                            <h2 className="mt-2 text-3xl font-bold">Agenda tu cita</h2>
                            <p className="mt-2 text-stone-400">Completa los pasos y confirma tu reserva</p>
                        </div>
                        <div className="mt-10">
                            <BookingWizard
                                services={services}
                                productCategories={productCategories}
                                initialServiceId={preSelectedServiceId}
                                initialEmployeeId={preSelectedEmployeeId}
                            />
                        </div>
                    </div>
                </section>

                <footer className="relative border-t border-stone-800/50 px-6 py-10 text-center text-sm text-stone-600 lg:px-12">
                    <div className="flex items-center justify-center gap-2">
                        <img src={logoImage} alt="BarberShop" className="h-8 w-auto" />
                    </div>
                    <p className="mt-2">© {new Date().getFullYear()} — Todos los derechos reservados</p>
                </footer>
            </div>
        </>
    );
}
