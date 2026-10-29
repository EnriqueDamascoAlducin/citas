import { Head, router } from '@inertiajs/react';
import { Maximize2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type BoardState = 'in_progress' | 'next' | 'confirmed' | 'scheduled';

type BoardRow = {
    id: number;
    time: string;
    client: string;
    service: string | null;
    barber: string | null;
    state: BoardState;
};

interface BoardPageProps {
    rows: BoardRow[];
}

// Se recarga cada 15 segundos; si no caben todas, cambia de página cada dos recargas.
const REFRESH_MS = 15_000;
// Alto de cada fila más su separación, y lo que ocupan encabezado y pie.
const ROW_HEIGHT = 92;
const ROW_GAP = 12;
const CHROME_HEIGHT = 240;

const COLUMNS = 'grid grid-cols-[8rem_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_14rem] items-center gap-6';

const STATES: Record<BoardState, { label: string; chip: string; dot: string }> = {
    in_progress: { label: 'En el sillón', chip: 'bg-stone-100 text-stone-900', dot: 'bg-stone-900' },
    next: { label: 'Siguiente', chip: 'bg-amber-500 text-stone-950', dot: 'bg-stone-950' },
    confirmed: { label: 'Confirmada', chip: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400' },
    scheduled: { label: 'Programada', chip: 'bg-stone-800 text-stone-300', dot: 'bg-stone-500' },
};

export default function BoardPage({ rows }: BoardPageProps) {
    const [tick, setTick] = useState(0);
    const [now, setNow] = useState(() => new Date());
    const [rowsPerPage, setRowsPerPage] = useState(6);

    useEffect(() => {
        // Sin recargas mientras la pestaña está oculta.
        const refresh = window.setInterval(() => {
            if (document.hidden) {
                return;
            }

            router.reload({ only: ['rows'] });
            setTick((value) => value + 1);
        }, REFRESH_MS);
        const clock = window.setInterval(() => setNow(new Date()), 1000);

        return () => {
            window.clearInterval(refresh);
            window.clearInterval(clock);
        };
    }, []);

    useEffect(() => {
        const measure = () => setRowsPerPage(Math.max(3, Math.floor((window.innerHeight - CHROME_HEIGHT) / (ROW_HEIGHT + ROW_GAP))));

        measure();
        window.addEventListener('resize', measure);

        return () => window.removeEventListener('resize', measure);
    }, []);

    // Las que están en el sillón o son las siguientes se quedan fijas arriba;
    // el resto rota por páginas cuando no cabe en pantalla.
    const { visible, page, pages } = useMemo(() => {
        const pinned = rows.filter((row) => row.state === 'in_progress' || row.state === 'next');
        const rest = rows.filter((row) => row.state !== 'in_progress' && row.state !== 'next');
        const slots = Math.max(1, rowsPerPage - pinned.length);
        const pages = Math.max(1, Math.ceil(rest.length / slots));
        const page = Math.floor(tick / 2) % pages;

        return {
            visible: [...pinned, ...rest.slice(page * slots, page * slots + slots)],
            page,
            pages,
        };
    }, [rows, rowsPerPage, tick]);

    function toggleFullscreen() {
        if (document.fullscreenElement) {
            void document.exitFullscreen();
        } else {
            void document.documentElement.requestFullscreen();
        }
    }

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-stone-950 text-stone-100">
            <Head title="Próximas citas" />

            <style>{`
                @keyframes board-next {
                    0%, 100% { border-color: rgb(245 158 11); background-color: rgb(245 158 11 / 0.12); }
                    50% { border-color: rgb(245 158 11 / 0.35); background-color: rgb(28 25 23); }
                }
                .board-next { animation: board-next 1.4s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) { .board-next { animation: none; } }
            `}</style>

            <header className="flex items-center justify-between border-b border-stone-800 px-12 py-6">
                <div>
                    <h1 className="font-display text-5xl font-semibold tracking-wide uppercase">Próximas citas</h1>
                    <p className="mt-1 text-xl text-stone-400 first-letter:uppercase">
                        {now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <span className="font-display text-6xl font-semibold text-amber-500 tabular-nums">
                        {now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        title="Pantalla completa"
                        className="cursor-pointer rounded-lg p-2 text-stone-700 transition hover:bg-stone-900 hover:text-stone-300"
                    >
                        <Maximize2 className="size-5" />
                    </button>
                </div>
            </header>

            <div className={`${COLUMNS} px-[4.5rem] pt-6 pb-3 text-lg font-medium tracking-wider text-stone-500 uppercase`}>
                <span>Hora</span>
                <span>Cliente</span>
                <span>Servicio</span>
                <span>Barbero</span>
                <span>Estado</span>
            </div>

            <main className="flex flex-1 flex-col overflow-hidden px-12" style={{ gap: ROW_GAP }}>
                {visible.length ? (
                    visible.map((row) => {
                        const state = STATES[row.state];

                        return (
                            <div
                                key={row.id}
                                style={{ height: ROW_HEIGHT }}
                                className={`${COLUMNS} shrink-0 rounded-xl border-2 px-6 ${
                                    row.state === 'next' ? 'board-next' : row.state === 'in_progress' ? 'border-stone-600 bg-stone-900' : 'border-stone-800/60 bg-stone-900/50'
                                }`}
                            >
                                <span className="font-display text-4xl font-semibold tabular-nums">{row.time}</span>
                                <span className="truncate text-3xl font-semibold">{row.client}</span>
                                <span className="truncate text-2xl text-stone-300">{row.service ?? '—'}</span>
                                <span className="truncate text-2xl text-stone-300">{row.barber ?? '—'}</span>
                                <span className={`inline-flex items-center gap-3 justify-self-start rounded-full px-5 py-2 text-xl font-semibold ${state.chip}`}>
                                    <span className={`size-2.5 rounded-full ${state.dot}`} />
                                    {state.label}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex h-full items-center justify-center text-3xl text-stone-500">No hay más citas por hoy</div>
                )}
            </main>

            <footer className="flex h-14 items-center px-12">
                {pages > 1 && (
                    <div className="flex items-center gap-2">
                        {Array.from({ length: pages }, (_, index) => (
                            <span key={index} className={`h-2.5 rounded-full transition-all ${index === page ? 'w-8 bg-amber-500' : 'w-2.5 bg-stone-700'}`} />
                        ))}
                    </div>
                )}
            </footer>
        </div>
    );
}
