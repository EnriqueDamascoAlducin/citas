import { Head, Link, router, usePage } from '@inertiajs/react';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { useEffect, useRef, useState } from 'react';
import { SiteLayout, btnPrimary, formatPrice } from '@/components/site/site-shell';

const STATUS: Record<string, { label: string; dot: string }> = {
    pending: { label: 'Pendiente de pago', dot: 'bg-amber-500' },
    confirmed: { label: 'Confirmada', dot: 'bg-emerald-500' },
    completed: { label: 'Completada', dot: 'bg-stone-500' },
    cancelled: { label: 'Cancelada', dot: 'bg-red-500' },
    no_show: { label: 'No asististe', dot: 'bg-red-500' },
};

const DAY_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTH_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatDate(value: string): { day: string; rest: string } {
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    return { day: String(d), rest: `${DAY_LONG[date.getDay()]}, ${MONTH_LONG[m - 1]}` };
}

function todayLocal(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Appointment = {
    id: number;
    service: string;
    employee: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    total_amount: number;
    notes: string | null;
    products: Array<{ name: string; quantity: number }>;
    is_paid: boolean;
};

type PageProps = {
    logoImage?: string;
    mercadopago?: { public_key: string };
    auth: { customer?: { name: string } | null };
};

export default function CustomerDashboard({ appointments }: { appointments: Appointment[] }) {
    const { logoImage, mercadopago, auth } = usePage().props as unknown as PageProps;
    const [payingId, setPayingId] = useState<number | null>(null);
    const [brickReady, setBrickReady] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);
    const brickContainerRef = useRef<HTMLDivElement>(null);
    const brickControllerRef = useRef<any>(null);

    useEffect(() => {
        loadMercadoPago()
            .then(() => {
                setBrickReady(true);
            })
            .catch((err) => {
                console.error('No se pudo cargar el SDK de Mercado Pago:', err);
                setPayError('No se pudo cargar Mercado Pago. Revisa tu conexión y recarga la página.');
            });
    }, []);

    async function openCardBrick(apt: Appointment) {
        setPayError(null);

        if (!mercadopago?.public_key) {
            setPayError('Falta configurar la llave pública de Mercado Pago.');

            return;
        }

        if (!brickReady) {
            setPayError('Mercado Pago aún se está cargando, espera un momento e inténtalo de nuevo.');

            return;
        }

        setPayingId(apt.id);

        setTimeout(async () => {
            if (!brickContainerRef.current) {
return;
}

            const mp = new (window as any).MercadoPago(mercadopago.public_key, { locale: 'es-MX' });
            const bricksBuilder = mp.bricks();

            const settings = {
                initialization: {
                    amount: Number(apt.total_amount),
                },
                customization: {
                    visual: {
                        style: {
                            theme: 'dark',
                        },
                    },
                },
                callbacks: {
                    onSubmit: (cardFormData: any) => {
                        return new Promise<void>((resolve, reject) => {
                            fetch('/process_payment', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Accept: 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.getAttribute('content') || '',
                                },
                                body: JSON.stringify({
                                    appointment_id: apt.id,
                                    token: cardFormData.token,
                                    payment_method_id: cardFormData.payment_method_id,
                                    installments: cardFormData.installments,
                                    issuer_id: cardFormData.issuer_id,
                                    email: cardFormData.payer?.email ?? cardFormData.cardholderEmail,
                                    identification_type: cardFormData.payer?.identification?.type ?? cardFormData.identificationType,
                                    identification_number: cardFormData.payer?.identification?.number ?? cardFormData.identificationNumber,
                                }),
                            })
                                .then(async (res) => {
                                    const data = await res.json().catch(() => ({}));

                                    if (res.ok && data.success) {
                                        resolve();
                                        setPayingId(null);
                                        router.reload();

                                        return;
                                    }

                                    const msg =
                                        data.error ||
                                        (data.errors ? Object.values(data.errors).flat().join(' ') : null) ||
                                        data.message ||
                                        `Error ${res.status} al procesar el pago`;
                                    setPayError(msg);
                                    reject(new Error(msg));
                                })
                                .catch((err) => {
                                    setPayError('Error de red al procesar el pago.');
                                    reject(err);
                                });
                        });
                    },
                    onReady: () => {},
                    onError: (error: any) => {
                        console.error('Brick error:', error);
                        setPayError('Error al mostrar el formulario de pago: ' + (error?.message || JSON.stringify(error)));
                    },
                },
            };

            try {
                brickControllerRef.current = await bricksBuilder.create(
                    'cardPayment',
                    'cardPaymentBrick_container',
                    settings,
                );
            } catch (err: any) {
                console.error('No se pudo crear el brick de pago:', err);
                setPayError('No se pudo crear el formulario de pago: ' + (err?.message || JSON.stringify(err)));
            }
        }, 100);
    }

    function cancelPayment() {
        if (brickControllerRef.current) {
            brickControllerRef.current.unmount();
            brickControllerRef.current = null;
        }

        setPayingId(null);
    }

    const today = todayLocal();
    const upcoming = appointments
        .filter((a) => a.date >= today && ['pending', 'confirmed'].includes(a.status))
        .sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
    const past = appointments.filter((a) => !upcoming.includes(a));
    const firstName = auth.customer?.name.split(' ')[0];

    function renderAppointment(apt: Appointment) {
        const status = STATUS[apt.status] ?? { label: apt.status, dot: 'bg-stone-500' };
        const { day, rest } = formatDate(apt.date);

        return (
            <li key={apt.id} className="py-6">
                <div className="grid gap-4 sm:grid-cols-[88px_1fr_auto] sm:gap-6">
                    <div className="flex items-baseline gap-2 sm:block">
                        <p className="font-display text-5xl leading-none font-bold tabular-nums">{day}</p>
                        <p className="text-sm text-stone-400 sm:mt-1">{rest}</p>
                    </div>

                    <div className="min-w-0">
                        <p className="text-lg font-medium">{apt.service}</p>
                        <p className="mt-0.5 text-sm text-stone-400">
                            {apt.start_time}–{apt.end_time} con {apt.employee}
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-sm text-stone-300">
                            <span className={`h-2 w-2 rounded-full ${status.dot}`} aria-hidden />
                            {status.label}
                        </p>
                        {apt.products.length > 0 && (
                            <p className="mt-2 text-sm text-stone-400">Productos: {apt.products.map((p) => `${p.name} ×${p.quantity}`).join(', ')}</p>
                        )}
                        {apt.notes && <p className="mt-2 text-sm text-stone-500">Notas: {apt.notes}</p>}
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start">
                        <p className="font-display text-2xl font-semibold tabular-nums">{formatPrice(apt.total_amount)}</p>
                        {apt.is_paid && <p className="text-sm text-emerald-400">Pagada</p>}
                        {apt.status === 'pending' && !apt.is_paid && payingId !== apt.id && (
                            <button type="button" onClick={() => openCardBrick(apt)} className={btnPrimary}>
                                Pagar con tarjeta
                            </button>
                        )}
                    </div>
                </div>

                {payingId === apt.id && (
                    <div className="mt-5 border border-stone-800 bg-stone-900 p-4 sm:ml-[112px]">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm text-stone-300">Pago de {formatPrice(apt.total_amount)}</p>
                            <button type="button" onClick={cancelPayment} className="cursor-pointer text-sm text-stone-500 hover:text-stone-200">
                                Cancelar
                            </button>
                        </div>
                        <div id="cardPaymentBrick_container" ref={brickContainerRef} />
                    </div>
                )}
            </li>
        );
    }

    return (
        <>
            <Head title="Mis citas" />
            <SiteLayout logoImage={logoImage}>
                <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
                    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-800 pb-5">
                        <div>
                            {firstName && <p className="text-sm text-stone-400">Hola, {firstName}</p>}
                            <h1 className="font-display text-5xl font-bold uppercase">Mis citas</h1>
                        </div>
                        <Link href="/#agendar" className={btnPrimary}>
                            Nueva cita
                        </Link>
                    </div>

                    {payError && (
                        <div role="alert" className="mt-6 border-l-2 border-red-500 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                            {payError}
                        </div>
                    )}

                    {appointments.length === 0 ? (
                        <div className="py-16">
                            <p className="text-lg">Todavía no tienes citas.</p>
                            <p className="mt-1 text-stone-400">Elige un servicio y un horario desde la página principal.</p>
                        </div>
                    ) : (
                        <>
                            <section className="mt-8">
                                <h2 className="text-xs uppercase tracking-wider text-stone-500">Próximas</h2>
                                {upcoming.length === 0 ? (
                                    <p className="py-6 text-stone-400">No tienes citas próximas.</p>
                                ) : (
                                    <ul className="divide-y divide-stone-800">{upcoming.map(renderAppointment)}</ul>
                                )}
                            </section>

                            {past.length > 0 && (
                                <section className="mt-10 border-t border-stone-800 pt-8">
                                    <h2 className="text-xs uppercase tracking-wider text-stone-500">Historial</h2>
                                    <ul className="divide-y divide-stone-800 opacity-80">{past.map(renderAppointment)}</ul>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </SiteLayout>
        </>
    );
}
