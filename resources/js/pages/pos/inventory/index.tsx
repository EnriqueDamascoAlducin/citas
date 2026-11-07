import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InventoryMovementDialog from '@/components/pos/inventory-movement-dialog';
import type { InventoryProduct } from '@/components/pos/inventory-movement-dialog';
import type { PageMeta } from '@/components/pos/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { money, shortDateTime } from '@/lib/money';
import { cn } from '@/lib/utils';

type StockRow = InventoryProduct & { category: string | null; price: number; active: boolean; level: 'ok' | 'low' | 'out' };

type Movement = {
    id: number;
    created_at: string;
    product: string | null;
    type: { value: string; label: string };
    quantity: number;
    stock_after: number;
    user: string | null;
    note: string | null;
    reference: { label: string; href: string | null } | null;
};

interface InventoryPageProps {
    products: StockRow[];
    summary: { units: number; value: number; low: number; out: number };
    movements: { data: Movement[]; meta: PageMeta };
    types: Array<{ value: string; label: string }>;
    filters: { from: string; to: string; product: number | null; type: string | null; search: string | null };
}

const LEVEL: Record<StockRow['level'], { label: string; variant: 'outline' | 'secondary' | 'destructive' }> = {
    ok: { label: 'Suficiente', variant: 'outline' },
    low: { label: 'Poco stock', variant: 'secondary' },
    out: { label: 'Agotado', variant: 'destructive' },
};

export default function InventoryPage({ products, summary, movements, types, filters }: InventoryPageProps) {
    const [editing, setEditing] = useState<InventoryProduct | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [productFilter, setProductFilter] = useState(filters.product ? String(filters.product) : '');
    const [type, setType] = useState(filters.type ?? '');
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    function reload(extra: Record<string, unknown> = {}) {
        router.get(
            '/pos/inventario',
            { search: search || undefined, product: productFilter || undefined, type: type || undefined, from, to, ...extra },
            { preserveState: true, preserveScroll: true },
        );
    }

    return (
        <>
            <Head title="Inventario" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading title="Inventario" description="Existencias, entradas de mercancía, ajustes e historial de cada movimiento." />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Piezas en existencia', value: summary.units.toLocaleString('es-MX') },
                        { label: 'Valor a precio de venta', value: money(summary.value) },
                        { label: 'Con poco stock', value: summary.low, warn: summary.low > 0 },
                        { label: 'Agotados', value: summary.out, warn: summary.out > 0 },
                    ].map((kpi) => (
                        <Card key={kpi.label}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-normal text-muted-foreground">{kpi.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={cn('text-2xl font-bold tabular-nums', kpi.warn && 'text-amber-500')}>{kpi.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Existencias */}
                <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-semibold">Existencias</h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                reload();
                            }}
                        >
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto" className="h-9 w-56" />
                        </form>
                    </div>
                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-muted-foreground">
                                    <th className="px-4 py-3 text-left font-medium">Producto</th>
                                    <th className="px-4 py-3 text-left font-medium">Categoría</th>
                                    <th className="px-4 py-3 text-right font-medium">Precio</th>
                                    <th className="px-4 py-3 text-right font-medium">Existencia</th>
                                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.id} className={cn('border-b last:border-0', !p.active && 'opacity-50')}>
                                        <td className="px-4 py-3 font-medium">
                                            {p.name}
                                            {!p.active && <span className="ml-2 text-xs text-muted-foreground">(inactivo)</span>}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{p.category ?? '—'}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{money(p.price)}</td>
                                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{p.stock}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={LEVEL[p.level].variant}>{LEVEL[p.level].label}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                                                Entrada / ajuste
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setProductFilter(String(p.id));
                                                    reload({ product: p.id });
                                                }}
                                            >
                                                Historial
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            No hay productos con ese nombre.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Historial */}
                <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-semibold">Historial de movimientos</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
                                <option value="">Todos los productos</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
                                <option value="">Todos los movimientos</option>
                                {types.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" aria-label="Desde" />
                            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" aria-label="Hasta" />
                            <Button variant="outline" size="sm" onClick={() => reload()}>
                                Filtrar
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-muted-foreground">
                                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                                    <th className="px-4 py-3 text-left font-medium">Producto</th>
                                    <th className="px-4 py-3 text-left font-medium">Movimiento</th>
                                    <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                                    <th className="px-4 py-3 text-right font-medium">Quedaron</th>
                                    <th className="px-4 py-3 text-left font-medium">Quién</th>
                                    <th className="px-4 py-3 text-left font-medium">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.data.map((m) => (
                                    <tr key={m.id} className="border-b last:border-0">
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{shortDateTime(m.created_at)}</td>
                                        <td className="px-4 py-3">{m.product ?? '—'}</td>
                                        <td className="px-4 py-3">{m.type.label}</td>
                                        <td className={cn('px-4 py-3 text-right font-semibold tabular-nums', m.quantity > 0 ? 'text-emerald-500' : 'text-destructive')}>
                                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">{m.stock_after}</td>
                                        <td className="px-4 py-3">{m.user ?? 'Sistema'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {m.reference &&
                                                (m.reference.href ? (
                                                    <Link href={m.reference.href} className="mr-2 text-primary hover:underline">
                                                        {m.reference.label}
                                                    </Link>
                                                ) : (
                                                    <span className="mr-2">{m.reference.label}</span>
                                                ))}
                                            {m.note}
                                        </td>
                                    </tr>
                                ))}
                                {movements.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                            No hay movimientos con estos filtros.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {movements.meta.last_page > 1 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                {movements.meta.from}–{movements.meta.to} de {movements.meta.total}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={movements.meta.current_page <= 1} onClick={() => reload({ page: movements.meta.current_page - 1 })}>
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={movements.meta.current_page >= movements.meta.last_page}
                                    onClick={() => reload({ page: movements.meta.current_page + 1 })}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {editing && <InventoryMovementDialog product={editing} onClose={() => setEditing(null)} />}
        </>
    );
}

InventoryPage.layout = {
    breadcrumbs: [{ title: 'Inventario', href: '/pos/inventario' }],
};
