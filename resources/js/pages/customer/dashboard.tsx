import { Head, Link, router, usePage } from '@inertiajs/react';
import { Calendar, Clock, CreditCard, Scissors } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { loadMercadoPago } from '@mercadopago/sdk-js';

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
};

type PageProps = {
    logoImage?: string;
    mercadopago?: { public_key: string };
};

export default function CustomerDashboard({ appointments }: { appointments: Appointment[] }) {
    const { logoImage, mercadopago } = usePage().props as PageProps;
    const [payingId, setPayingId] = useState<number | null>(null);
    const [brickReady, setBrickReady] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);
    const brickContainerRef = useRef<HTMLDivElement>(null);
    const brickControllerRef = useRef<any>(null);

    const statusStyles: Record<string, string> = {
        pending: 'bg-yellow-500/10 text-yellow-400',
        confirmed: 'bg-green-500/10 text-green-400',
        completed: 'bg-blue-500/10 text-blue-400',
        cancelled: 'bg-red-500/10 text-red-400',
    };

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

    function handleLogout() {
        router.post('/cliente/logout');
    }

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
            if (!brickContainerRef.current) return;

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

    return (
        <>
            <Head title="Mi Cuenta" />
            <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-stone-100">
                <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
                />

                <header className="relative z-20 flex items-center justify-between px-6 py-4 lg:px-12">
                    <Link href="/">
                        <img src={logoImage || '/storage/images/logo.png'} alt="BarberShop" className="h-10 w-auto" />
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link href="/" className="text-sm text-stone-400 hover:text-amber-400 transition-colors">Inicio</Link>
                        <button onClick={handleLogout} className="text-sm text-stone-400 hover:text-amber-400 transition-colors cursor-pointer">
                            Cerrar Sesión
                        </button>
                    </nav>
                </header>

                <main className="relative mx-auto max-w-3xl px-6 py-10">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">Mis Citas</h1>
                        <p className="mt-1 text-stone-400">Historial de tus citas agendadas</p>
                    </div>

                    {payError && (
                        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {payError}
                        </div>
                    )}

                    <div className="mt-8 space-y-4">
                        {appointments.length === 0 ? (
                            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-8 text-center">
                                <Calendar className="mx-auto h-12 w-12 text-stone-600" />
                                <h3 className="mt-4 text-lg font-medium text-stone-400">No tienes citas</h3>
                                <p className="mt-1 text-sm text-stone-500">Agenda tu primera cita desde la página principal.</p>
                                <Link href="/" className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-400 transition-colors">
                                    Agendar Cita
                                </Link>
                            </div>
                        ) : (
                            appointments.map((apt) => (
                                <div key={apt.id} className="rounded-xl border border-stone-800 bg-stone-900/50 p-5 transition hover:border-stone-700">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold">{apt.service}</h3>
                                            <p className="mt-1 text-sm text-stone-400">con {apt.employee}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[apt.status] || 'bg-stone-800 text-stone-400'}`}>
                                            {apt.status === 'pending' ? 'Pendiente' :
                                             apt.status === 'confirmed' ? 'Confirmada' :
                                             apt.status === 'completed' ? 'Completada' :
                                             apt.status === 'cancelled' ? 'Cancelada' : apt.status}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-stone-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {apt.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {apt.start_time} - {apt.end_time}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Scissors className="h-4 w-4" />
                                            ${Number(apt.total_amount).toFixed(2)}
                                        </span>
                                    </div>
                                    {apt.notes && (
                                        <p className="mt-2 text-sm text-stone-500">Notas: {apt.notes}</p>
                                    )}
                                    {apt.status === 'pending' && payingId !== apt.id && (
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                onClick={() => openCardBrick(apt)}
                                                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-400 transition-colors"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                Pagar con Tarjeta
                                            </button>
                                        </div>
                                    )}
                                    {payingId === apt.id && (
                                        <div className="mt-4 rounded-xl border border-stone-700 bg-stone-800/50 p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <p className="text-sm font-medium text-stone-300">
                                                    Pagar — ${Number(apt.total_amount).toFixed(2)}
                                                </p>
                                                <button
                                                    onClick={cancelPayment}
                                                    className="text-sm text-stone-500 hover:text-stone-300 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                            <div id="cardPaymentBrick_container" ref={brickContainerRef} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </main>

                <footer className="relative border-t border-stone-800/50 px-6 py-10 text-center text-sm text-stone-600 lg:px-12">
                    <div className="flex items-center justify-center gap-2">
                        <img src={logoImage || '/storage/images/logo.png'} alt="BarberShop" className="h-8 w-auto" />
                    </div>
                    <p className="mt-2">© {new Date().getFullYear()} — Todos los derechos reservados</p>
                </footer>
            </div>
        </>
    );
}
