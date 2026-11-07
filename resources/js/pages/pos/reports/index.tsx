import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { money } from '@/lib/money';

type Row = { label?: string; name?: string; count?: number; units?: number; total: number };

interface SalesReportPageProps {
    filters: { from: string; to: string };
    totals: {
        count: number;
        revenue: number;
        average: number;
        units: number;
        cancelled_count: number;
        cancelled_total: number;
        online_units: number;
        online_total: number;
    };
    byDay: Array<{ date: string; count: number; total: number }>;
    byPaymentMethod: Row[];
    topProducts: Row[];
    bySeller: Row[];
}

function RankTable({ title, rows, nameKey, countLabel, countKey, empty }: { title: string; rows: Row[]; nameKey: 'label' | 'name'; countLabel: string; countKey: 'count' | 'units'; empty: string }) {
    const max = Math.max(...rows.map((r) => r.total), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {rows.length === 0 || rows.every((r) => r.total === 0) ? (
                    <p className="text-sm text-muted-foreground">{empty}</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-muted-foreground">
                                <th className="pb-2 text-left font-medium" />
                                <th className="pb-2 text-right font-medium">{countLabel}</th>
                                <th className="pb-2 text-right font-medium">Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row[nameKey]} className="border-t">
                                    <td className="py-2 pr-4">
                                        {row[nameKey]}
                                        <span className="mt-1 block h-1.5 rounded-full bg-primary" style={{ width: `${(row.total / max) * 100}%` }} />
                                    </td>
                                    <td className="py-2 text-right tabular-nums">{row[countKey]}</td>
                                    <td className="py-2 text-right font-medium tabular-nums">{money(row.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </CardContent>
        </Card>
    );
}

export default function SalesReportPage({ filters, totals, byDay, byPaymentMethod, topProducts, bySeller }: SalesReportPageProps) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    return (
        <>
            <Head title="Reporte de ventas" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <Heading title="Reporte de ventas" description="Ventas de productos en mostrador. Las canceladas no cuentan." />
                    <div className="flex flex-wrap items-center gap-2">
                        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" aria-label="Desde" />
                        <span className="text-muted-foreground">—</span>
                        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" aria-label="Hasta" />
                        <Button variant="outline" size="sm" onClick={() => router.get('/pos/reportes', { from, to }, { preserveScroll: true })}>
                            Filtrar
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Ingresos', value: money(totals.revenue), note: `${totals.count} ${totals.count === 1 ? 'venta' : 'ventas'}` },
                        { label: 'Ticket promedio', value: money(totals.average), note: 'por venta' },
                        { label: 'Piezas vendidas', value: totals.units.toLocaleString('es-MX'), note: 'en mostrador' },
                        {
                            label: 'Canceladas',
                            value: totals.cancelled_count,
                            note: totals.cancelled_count ? `${money(totals.cancelled_total)} devueltos al inventario` : 'ninguna',
                        },
                    ].map((kpi) => (
                        <Card key={kpi.label}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-normal text-muted-foreground">{kpi.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
                                <p className="text-xs text-muted-foreground">{kpi.note}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <p className="text-sm text-muted-foreground">
                    Aparte, en citas atendidas se entregaron {totals.online_units} {totals.online_units === 1 ? 'pieza' : 'piezas'} apartadas en línea por{' '}
                    <span className="text-foreground tabular-nums">{money(totals.online_total)}</span>; ese ingreso entra con el cobro de la cita.
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Ingresos por día</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={byDay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(8)} stroke="var(--muted-foreground)" />
                                <YAxis tickFormatter={(v: number) => `$${v}`} stroke="var(--muted-foreground)" width={60} />
                                <Tooltip
                                    cursor={{ fill: 'color-mix(in oklch, var(--primary) 10%, transparent)' }}
                                    labelFormatter={(v) => new Date(String(v) + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    formatter={(value, _name, item) => [`${money(Number(value))} · ${item.payload.count} ventas`, 'Ingresos']}
                                    contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                                />
                                <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-3">
                    <RankTable title="Productos más vendidos" rows={topProducts} nameKey="name" countLabel="Piezas" countKey="units" empty="Sin ventas en estas fechas." />
                    <RankTable title="Por vendedor" rows={bySeller} nameKey="name" countLabel="Ventas" countKey="count" empty="Sin ventas en estas fechas." />
                    <RankTable title="Por forma de pago" rows={byPaymentMethod} nameKey="label" countLabel="Ventas" countKey="count" empty="Sin ventas en estas fechas." />
                </div>
            </div>
        </>
    );
}

SalesReportPage.layout = {
    breadcrumbs: [{ title: 'Reporte de ventas', href: '/pos/reportes' }],
};
