import { Head, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import BookingWizard from '@/components/booking-wizard';
import {
    SectionTitle,
    SiteLayout,
    btnPrimary,
    formatPrice,
} from '@/components/site/site-shell';

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

const NAV_LINKS = [
    { href: '#servicios', label: 'Servicios' },
    { href: '#barberos', label: 'Barberos' },
    { href: '#agendar', label: 'Agendar' },
];

export default function Welcome() {
    const { services, employees, productCategories, heroImage, logoImage } =
        usePage().props as unknown as {
            services: Service[];
            employees: Employee[];
            productCategories: ProductCategory[];
            heroImage: string;
            logoImage: string;
        };

    const [preSelectedServiceId, setPreSelectedServiceId] = useState<
        number | undefined
    >(() => {
        const v = new URLSearchParams(window.location.search).get('service_id');

        return v ? Number(v) : undefined;
    });
    const [preSelectedEmployeeId, setPreSelectedEmployeeId] = useState<
        number | undefined
    >(() => {
        const v = new URLSearchParams(window.location.search).get(
            'employee_id',
        );

        return v ? Number(v) : undefined;
    });

    const scrollToBooking = useCallback(() => {
        document
            .getElementById('agendar')
            ?.scrollIntoView({ behavior: 'smooth' });
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

    return (
        <>
            <Head title="Barbería" />

            <SiteLayout logoImage={logoImage} links={NAV_LINKS}>
                {/* Portada */}
                <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 lg:pt-16 lg:pb-20">
                    <p className="text-sm text-stone-400">
                        Barbería profesional desde 2024
                    </p>
                    <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-16">
                        <h1 className="font-display text-6xl leading-[0.9] font-bold uppercase sm:text-7xl lg:text-[7.5rem]">
                            Estilo clásico,
                            <br />
                            <span className="text-amber-500">
                                corte perfecto
                            </span>
                        </h1>
                        <div className="lg:pb-3">
                            <p className="max-w-md text-lg leading-relaxed text-stone-300">
                                Barbería tradicional con los mejores
                                profesionales. Cortes modernos y clásicos,
                                barba, y productos de cuidado personal.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-6">
                                <button
                                    type="button"
                                    onClick={scrollToBooking}
                                    className={`${btnPrimary} px-7 py-3 text-base`}
                                >
                                    Agendar cita
                                </button>
                                <a
                                    href="#servicios"
                                    className="text-sm text-stone-300 underline decoration-stone-600 underline-offset-4 hover:text-white hover:decoration-amber-500"
                                >
                                    Ver precios
                                </a>
                            </div>
                        </div>
                    </div>

                    <img
                        src={heroImage}
                        alt="Interior de la barbería"
                        className="mt-12 aspect-[3/2] w-full rounded-sm object-cover"
                    />

                    <dl className="mt-8 grid grid-cols-3 text-sm">
                        <div>
                            <dt className="text-stone-500">Barberos</dt>
                            <dd className="mt-1 font-medium">
                                {employees.length}
                            </dd>
                        </div>
                        <div className="border-l border-stone-800 pl-4">
                            <dt className="text-stone-500">Horario</dt>
                            <dd className="mt-1 font-medium">
                                Lun–Sáb, 9:00–18:00
                            </dd>
                        </div>
                        <div className="border-l border-stone-800 pl-4">
                            <dt className="text-stone-500">Ubicación</dt>
                            <dd className="mt-1 font-medium">Tu ciudad</dd>
                        </div>
                    </dl>
                </section>

                {/* Servicios: lista de precios */}
                {services.length > 0 && (
                    <section
                        id="servicios"
                        className="scroll-mt-6 border-t border-stone-800 bg-stone-900"
                    >
                        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
                            <SectionTitle
                                title="Servicios y precios"
                                aside="Precios en MXN"
                            />

                            <ul className="mt-2 grid gap-x-16 lg:grid-cols-2">
                                {services.map((service) => (
                                    <li
                                        key={service.id}
                                        className="border-b border-stone-800 py-5"
                                    >
                                        <div className="flex items-baseline gap-3">
                                            <h3 className="text-lg font-medium">
                                                {service.name}
                                            </h3>
                                            <span
                                                className="mb-1 flex-1 border-b border-dotted border-stone-600"
                                                aria-hidden
                                            />
                                            <span className="font-display text-2xl font-semibold text-amber-500">
                                                {formatPrice(service.price)}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 flex items-start justify-between gap-6">
                                            <p className="text-sm text-stone-400">
                                                {service.description
                                                    ? `${service.description} · `
                                                    : ''}
                                                {service.duration_minutes} min
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handlePreselectService(
                                                        service.id,
                                                    )
                                                }
                                                className="shrink-0 cursor-pointer text-sm font-medium text-amber-500 hover:text-amber-400"
                                            >
                                                Agendar
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                )}

                {/* Equipo */}
                {employees.length > 0 && (
                    <section
                        id="barberos"
                        className="scroll-mt-6 border-t border-stone-800"
                    >
                        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
                            <SectionTitle
                                title="Barberos"
                                aside="Horarios de atención de cada uno"
                            />

                            <ul className="divide-y divide-stone-800">
                                {employees.map((employee) => (
                                    <li
                                        key={employee.id}
                                        className="grid gap-5 py-7 md:grid-cols-[220px_1fr_auto] md:items-start md:gap-10"
                                    >
                                        <div>
                                            <h3 className="font-display text-2xl font-semibold tracking-wide uppercase">
                                                {employee.name}
                                            </h3>
                                            <p className="text-sm text-stone-500">
                                                Barbero
                                            </p>
                                        </div>

                                        <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-3">
                                            {[1, 2, 3, 4, 5, 6].map((day) => {
                                                const slots =
                                                    employee.schedules[
                                                        String(day)
                                                    ] ?? [];

                                                return (
                                                    <div
                                                        key={day}
                                                        className="flex gap-3"
                                                    >
                                                        <dt className="w-9 text-stone-500">
                                                            {DAY_SHORT[day]}
                                                        </dt>
                                                        <dd
                                                            className={
                                                                slots.length > 0
                                                                    ? 'text-stone-200 tabular-nums'
                                                                    : 'text-stone-600'
                                                            }
                                                        >
                                                            {slots.length > 0
                                                                ? slots
                                                                      .map(
                                                                          (s) =>
                                                                              `${s.start_time}–${s.end_time}`,
                                                                      )
                                                                      .join(
                                                                          ', ',
                                                                      )
                                                                : 'Descansa'}
                                                        </dd>
                                                    </div>
                                                );
                                            })}
                                        </dl>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handlePreselectEmployee(
                                                    employee.id,
                                                )
                                            }
                                            className="cursor-pointer self-start text-left text-sm font-medium text-amber-500 hover:text-amber-400 md:text-right"
                                        >
                                            Agendar con{' '}
                                            {employee.name.split(' ')[0]}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                )}

                {/* Reserva */}
                <section
                    id="agendar"
                    className="scroll-mt-6 border-t border-stone-800 bg-stone-900"
                >
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
                        <SectionTitle title="Agenda tu cita" />
                        <div className="mt-8">
                            <BookingWizard
                                services={services}
                                productCategories={productCategories}
                                initialServiceId={preSelectedServiceId}
                                initialEmployeeId={preSelectedEmployeeId}
                            />
                        </div>
                    </div>
                </section>
            </SiteLayout>
        </>
    );
}
