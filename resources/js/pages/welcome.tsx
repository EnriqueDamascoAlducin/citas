import { Head, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import BookingWizard from '@/components/booking-wizard';
import {
    SiteLayout,
    btnPrimary,
    formatDuration,
    formatPrice,
} from '@/components/site/site-shell';

type Service = {
    id: number;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: string | number;
    deposit_amount: string | number;
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
    { href: '#catalogo', label: 'Catálogo' },
    { href: '#tatuadores', label: 'Tatuadores' },
    { href: '#antes', label: 'Antes de tu cita' },
    { href: '#agendar', label: 'Agendar' },
];

const STYLES = [
    'Línea fina',
    'Realismo',
    'Tradicional',
    'Blackwork',
    'Lettering',
    'Neotradicional',
    'Cover-up',
    'Perforaciones',
];

// Lunes a domingo, con el número de día de Carbon (0 = domingo).
const WEEK = [
    { day: 1, short: 'L', long: 'Lunes' },
    { day: 2, short: 'M', long: 'Martes' },
    { day: 3, short: 'M', long: 'Miércoles' },
    { day: 4, short: 'J', long: 'Jueves' },
    { day: 5, short: 'V', long: 'Viernes' },
    { day: 6, short: 'S', long: 'Sábado' },
    { day: 0, short: 'D', long: 'Domingo' },
];

const AFTER_BOOKING = [
    {
        title: 'Manda tu referencia',
        text: 'Sube una foto o boceto, la zona del cuerpo y el tamaño. Tu tatuador la revisa antes de la cita.',
    },
    {
        title: 'Aparta con anticipo',
        text: 'El anticipo asegura tu lugar y se descuenta del total el día de tu sesión.',
    },
    {
        title: 'Trae tu INE',
        text: 'Solo tatuamos a mayores de 18 años con identificación oficial.',
    },
    {
        title: 'Llega preparado',
        text: 'Come bien, hidrátate, nada de alcohol 24 h antes y ropa que deje libre la zona.',
    },
];

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function Ornament({ className = '' }: { className?: string }) {
    return (
        <span aria-hidden className={`select-none ${className}`}>
            ✦
        </span>
    );
}

/** Título de sección centrado con adornos, en tono papel o tinta. */
function SectionHeading({
    eyebrow,
    title,
    tone,
    children,
}: {
    eyebrow: string;
    title: string;
    tone: 'paper' | 'ink';
    children?: ReactNode;
}) {
    const line = tone === 'paper' ? 'bg-ink/25' : 'bg-stone-700';

    return (
        <div className="mx-auto max-w-2xl text-center">
            <p
                className={`text-xs font-semibold tracking-[0.3em] uppercase ${tone === 'paper' ? 'text-red-700' : 'text-red-500'}`}
            >
                {eyebrow}
            </p>
            <div className="mt-3 flex items-center justify-center gap-4">
                <span className={`hidden h-px w-16 sm:block ${line}`} />
                <Ornament className="text-red-600" />
                <h2 className="font-tattoo text-5xl leading-none sm:text-6xl">
                    {title}
                </h2>
                <Ornament className="text-red-600" />
                <span className={`hidden h-px w-16 sm:block ${line}`} />
            </div>
            {children && (
                <p
                    className={`mt-4 text-base ${tone === 'paper' ? 'text-stone-600' : 'text-stone-400'}`}
                >
                    {children}
                </p>
            )}
        </div>
    );
}

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
            <Head title="Estudio de tatuajes" />

            <SiteLayout logoImage={logoImage} links={NAV_LINKS}>
                {/* Portada a pantalla completa con la ilustración de fondo */}
                <section className="relative isolate flex min-h-[calc(100svh-77px)] flex-col overflow-hidden">
                    <img
                        src={heroImage}
                        alt=""
                        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-60"
                    />
                    <div
                        aria-hidden
                        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(12,10,9,0.55)_0%,rgba(12,10,9,0.92)_70%)]"
                    />

                    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
                        <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.35em] text-stone-300 uppercase">
                            <Ornament className="text-red-500" />
                            Tatuajes · Perforaciones
                            <Ornament className="text-red-500" />
                        </p>
                        <h1 className="mt-6 font-tattoo text-7xl leading-[0.9] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] sm:text-8xl lg:text-[9rem]">
                            Tu idea,
                            <span className="block text-red-500">
                                en tu piel
                            </span>
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-200">
                            Diseños a tu medida con tatuadores de estilo propio,
                            material estéril y seguimiento hasta que cicatrice.
                        </p>
                        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                            <button
                                type="button"
                                onClick={scrollToBooking}
                                className={`${btnPrimary} px-9 py-3.5 text-base shadow-[4px_4px_0_0_#f5f5f4]`}
                            >
                                Agendar mi cita
                            </button>
                            <a
                                href="#catalogo"
                                className="inline-flex items-center justify-center rounded-sm border border-stone-300/60 px-9 py-3.5 text-base text-stone-100 transition-colors hover:border-white hover:bg-white/5"
                            >
                                Ver catálogo
                            </a>
                        </div>
                    </div>

                    {/* Cinta de estilos */}
                    <div className="overflow-hidden border-y-2 border-ink bg-red-600 py-3 text-white">
                        <div className="flex w-max animate-marquee gap-8 motion-reduce:animate-none">
                            {[...STYLES, ...STYLES].map((style, i) => (
                                <span
                                    key={i}
                                    className="flex items-center gap-8 font-tattoo text-2xl whitespace-nowrap"
                                    aria-hidden={i >= STYLES.length}
                                >
                                    {style}
                                    <Ornament className="text-base text-ink" />
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Catálogo: tarjetas tipo hoja de flash sobre papel */}
                {services.length > 0 && (
                    <section
                        id="catalogo"
                        className="scroll-mt-6 bg-paper text-ink"
                    >
                        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
                            <SectionHeading
                                eyebrow="Precios en MXN"
                                title="Catálogo"
                                tone="paper"
                            >
                                El precio final lo confirma tu tatuador según
                                tamaño, detalle y zona.
                            </SectionHeading>

                            <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {services.map((service, i) => {
                                    const deposit = Number(
                                        service.deposit_amount,
                                    );

                                    return (
                                        <li
                                            key={service.id}
                                            className="group flex flex-col border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_0_#0c0a09] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#dc2626]"
                                        >
                                            <div className="flex items-center justify-between text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">
                                                <span>
                                                    Nº{' '}
                                                    {String(i + 1).padStart(
                                                        2,
                                                        '0',
                                                    )}
                                                </span>
                                                <span>
                                                    {formatDuration(
                                                        service.duration_minutes,
                                                    )}
                                                </span>
                                            </div>
                                            <h3 className="mt-4 font-tattoo text-4xl leading-none">
                                                {service.name}
                                            </h3>
                                            {service.description && (
                                                <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-600">
                                                    {service.description}
                                                </p>
                                            )}
                                            <div className="mt-6 flex items-end justify-between gap-4 border-t-2 border-dashed border-ink/30 pt-4">
                                                <div>
                                                    <p className="font-display text-4xl leading-none font-bold">
                                                        {Number(
                                                            service.price,
                                                        ) === 0
                                                            ? 'Gratis'
                                                            : formatPrice(
                                                                  service.price,
                                                              )}
                                                    </p>
                                                    <p className="mt-1 text-xs text-stone-600">
                                                        {deposit > 0
                                                            ? `Apartas con ${formatPrice(deposit)}`
                                                            : 'Sin anticipo'}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handlePreselectService(
                                                            service.id,
                                                        )
                                                    }
                                                    className="shrink-0 cursor-pointer rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors group-hover:bg-red-600 group-hover:text-white"
                                                >
                                                    Lo quiero
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </section>
                )}

                {/* Tatuadores: insignias sobre tinta */}
                {employees.length > 0 && (
                    <section
                        id="tatuadores"
                        className="scroll-mt-6 border-t-2 border-ink bg-ink"
                    >
                        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
                            <SectionHeading
                                eyebrow="El equipo"
                                title="Tatuadores"
                                tone="ink"
                            >
                                Elige con quién tatuarte. Los días marcados en
                                rojo son los que atiende.
                            </SectionHeading>

                            <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {employees.map((employee) => (
                                    <li
                                        key={employee.id}
                                        className="flex flex-col items-center border border-stone-800 bg-stone-900/60 px-6 py-8 text-center"
                                    >
                                        <div className="relative grid size-28 place-items-center rounded-full border-2 border-stone-200">
                                            <span
                                                aria-hidden
                                                className="absolute inset-2 rounded-full border-2 border-dashed border-red-600/80"
                                            />
                                            <span className="font-tattoo text-5xl text-stone-100">
                                                {initials(employee.name)}
                                            </span>
                                        </div>
                                        <h3 className="mt-5 font-tattoo text-4xl leading-none">
                                            {employee.name}
                                        </h3>
                                        <p className="mt-1 text-xs font-semibold tracking-[0.25em] text-stone-500 uppercase">
                                            Tatuador
                                        </p>

                                        <ul
                                            className="mt-5 flex gap-1.5"
                                            aria-label="Días de atención"
                                        >
                                            {WEEK.map(({ day, short, long }) => {
                                                const slots =
                                                    employee.schedules[
                                                        String(day)
                                                    ] ?? [];
                                                const works = slots.length > 0;
                                                const hours = slots
                                                    .map(
                                                        (s) =>
                                                            `${s.start_time}–${s.end_time}`,
                                                    )
                                                    .join(', ');

                                                return (
                                                    <li
                                                        key={day}
                                                        title={
                                                            works
                                                                ? `${long}: ${hours}`
                                                                : `${long}: descansa`
                                                        }
                                                        className={`grid size-8 place-items-center rounded-full text-xs font-semibold ${
                                                            works
                                                                ? 'bg-red-600 text-white'
                                                                : 'border border-stone-700 text-stone-600'
                                                        }`}
                                                    >
                                                        <span aria-hidden>
                                                            {short}
                                                        </span>
                                                        <span className="sr-only">
                                                            {works
                                                                ? `${long} ${hours}`
                                                                : `${long} descansa`}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handlePreselectEmployee(
                                                    employee.id,
                                                )
                                            }
                                            className="mt-7 w-full cursor-pointer rounded-sm border border-stone-600 px-4 py-2.5 text-sm font-semibold text-stone-100 transition-colors hover:border-red-500 hover:bg-red-600"
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

                {/* Antes de tu cita: línea de pasos sobre papel */}
                <section id="antes" className="scroll-mt-6 bg-paper-dark text-ink">
                    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
                        <SectionHeading
                            eyebrow="Lo que necesitas saber"
                            title="Antes de tu cita"
                            tone="paper"
                        />

                        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
                            <span
                                aria-hidden
                                className="absolute top-8 right-[12.5%] left-[12.5%] hidden border-t-2 border-dashed border-ink/40 md:block"
                            />
                            {AFTER_BOOKING.map((item, i) => (
                                <li
                                    key={item.title}
                                    className="relative flex gap-5 md:flex-col md:items-center md:text-center"
                                >
                                    <span className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-ink bg-red-600 font-display text-3xl font-bold text-white shadow-[3px_3px_0_0_#0c0a09]">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <h3 className="font-tattoo text-3xl leading-none md:mt-5">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-stone-700">
                                            {item.text}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Reserva */}
                <section
                    id="agendar"
                    className="scroll-mt-6 border-t-2 border-ink bg-ink"
                >
                    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
                        <SectionHeading
                            eyebrow="En línea, en 2 minutos"
                            title="Agenda tu cita"
                            tone="ink"
                        />
                        <div className="mt-14 border border-stone-800 bg-stone-950 p-5 sm:p-8">
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
