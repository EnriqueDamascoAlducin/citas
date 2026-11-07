import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import CancelSaleDialog from '@/components/pos/cancel-sale-dialog';
import type { PageMeta, SaleData } from '@/components/pos/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { money, shortDateTime } from '@/lib/money';

interface SalesIndexPageProps {
    sales: { data: SaleData[]; meta: PageMeta };
    summary: { count: number; total: number };
    filters: { from: string; to: string; seller: number | null };
    sellers: Array<{ id: number; name: string }>;
    seesAll: boolean;
}

export default function SalesIndexPage({ sales, summary, filters, sellers, seesAll }: SalesIndexPageProps) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [seller, setSeller] = useState(filters.seller ? String(filters.seller) : '');
    const [cancelling, setCancelling] = useState<SaleData | null>(null);

    function applyFilters(page?: number) {
        router.get('/pos/ventas', { from, to, seller: seller || undefined, page }, { preserveState: true, preserveScroll: true });
    }

    return (
        <>
            <Head title="Ventas" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <Heading title="Ventas" description={seesAll ? 'Ventas en mostrador de todo el equipo.' : 'Tus ventas en mostrador.'} />
                    <div className="flex flex-wrap items-center gap-2">
                        {seesAll && (
                            <select value={seller} onChange={(e) => setSeller(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
                                <option value="">Todos los vendedores</option>
                                {sellers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" aria-label="Desde" />
                        <span className="text-muted-foreground">—</span>
                        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" aria-label="Hasta" />
                        <Button variant="outline" size="sm" onClick={() => applyFilters()}>
                            Filtrar
                        </Button>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    {summary.count} {summary.count === 1 ? 'venta' : 'ventas'} por <strong className="text-foreground tabular-nums">{money(summary.total)}</strong>, sin contar las canceladas.
                </p>

                <div className="overflow-x-auto rounded-lg border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-muted-foreground">
                                <th className="px-4 py-3 text-left font-medium">Folio</th>
                                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                                {seesAll && <th className="px-4 py-3 text-left font-medium">Vendió</th>}
                                <th className="px-4 py-3 text-left font-medium">Productos</th>
                                <th className="px-4 py-3 text-left font-medium">Pago</th>
                                <th className="px-4 py-3 text-right font-medium">Total</th>
                                <th className="px-4 py-3 text-right font-medium">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.data.map((sale) => (
                                <tr key={sale.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">
                                        <Link href={`/pos/ventas/${sale.id}`} className="hover:text-primary hover:underline">
                                            {sale.folio}
                                        </Link>
                                        {sale.status === 'cancelled' && (
                                            <Badge variant="destructive" className="ml-2">
                                                Cancelada
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{shortDateTime(sale.created_at)}</td>
                                    {seesAll && <td className="px-4 py-3">{sale.seller ?? '—'}</td>}
                                    <td className="max-w-64 px-4 py-3 text-muted-foreground">
                                        <span className="line-clamp-1">{sale.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</span>
                                    </td>
                                    <td className="px-4 py-3">{sale.payment_method.label}</td>
                                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${sale.status === 'cancelled' ? 'text-muted-foreground line-through' : ''}`}>{money(sale.total)}</td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/pos/ventas/${sale.id}`}>Ver ticket</Link>
                                        </Button>
                                        {sale.can_cancel && (
                                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setCancelling(sale)}>
                                                Cancelar
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {sales.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                                        No hay ventas en estas fechas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {sales.meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {sales.meta.from}–{sales.meta.to} de {sales.meta.total}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={sales.meta.current_page <= 1} onClick={() => applyFilters(sales.meta.current_page - 1)}>
                                Anterior
                            </Button>
                            <Button variant="outline" size="sm" disabled={sales.meta.current_page >= sales.meta.last_page} onClick={() => applyFilters(sales.meta.current_page + 1)}>
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {cancelling && <CancelSaleDialog sale={cancelling} onClose={() => setCancelling(null)} />}
        </>
    );
}

SalesIndexPage.layout = {
    breadcrumbs: [{ title: 'Ventas', href: '/pos/ventas' }],
};
