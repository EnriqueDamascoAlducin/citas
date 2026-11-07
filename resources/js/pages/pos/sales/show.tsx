import { Head, Link } from '@inertiajs/react';
import { Mail, Printer } from 'lucide-react';
import { useState } from 'react';
import CancelSaleDialog from '@/components/pos/cancel-sale-dialog';
import EmailTicketDialog from '@/components/pos/email-ticket-dialog';
import type { SaleData } from '@/components/pos/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { money } from '@/lib/money';

interface SaleShowPageProps {
    sale: SaleData;
}

export default function SaleShowPage({ sale }: SaleShowPageProps) {
    const [cancelling, setCancelling] = useState(false);
    const [emailing, setEmailing] = useState(false);
    const cancelled = sale.status === 'cancelled';

    return (
        <>
            <Head title={`Venta ${sale.folio}`} />
            {/* Al imprimir se oculta el panel (menú y encabezado) y queda solo el ticket. */}
            <style>{`@media print { [data-slot="sidebar"], [data-sidebar="sidebar"], header { display: none !important; } main { margin: 0 !important; box-shadow: none !important; } }`}</style>

            <div className="flex flex-1 flex-col items-center gap-4 p-4">
                <div className="flex w-full max-w-md flex-wrap items-center justify-between gap-2 print:hidden">
                    <Button asChild>
                        <Link href="/pos">Nueva venta</Link>
                    </Button>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="size-4" /> Imprimir
                        </Button>
                        <Button variant="outline" onClick={() => setEmailing(true)}>
                            <Mail className="size-4" /> Enviar por correo
                        </Button>
                        {sale.can_cancel && (
                            <Button variant="outline" className="text-destructive" onClick={() => setCancelling(true)}>
                                Cancelar venta
                            </Button>
                        )}
                    </div>
                </div>

                {sale.emailed_to && sale.emailed_at && (
                    <p className="w-full max-w-md text-sm text-muted-foreground print:hidden">
                        Enviado a {sale.emailed_to} el {new Date(sale.emailed_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}.
                    </p>
                )}

                {/* Ticket; al imprimir solo sale esta parte. */}
                <article className="w-full max-w-md rounded-lg border bg-card p-6 print:max-w-none print:border-0 print:p-0">
                    <header className="mb-4 text-center">
                        <p className="text-lg font-semibold">Ticket de venta</p>
                        <p className="text-sm text-muted-foreground">
                            {sale.folio} · {new Date(sale.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        {cancelled && (
                            <Badge variant="destructive" className="mt-2">
                                Cancelada
                            </Badge>
                        )}
                    </header>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-muted-foreground">
                                <th className="py-2 text-left font-medium">Producto</th>
                                <th className="py-2 text-right font-medium">Cant.</th>
                                <th className="py-2 text-right font-medium">Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items?.map((item, i) => (
                                <tr key={i} className="border-b border-dashed">
                                    <td className="py-2">
                                        {item.name}
                                        <span className="block text-xs text-muted-foreground tabular-nums">{money(item.unit_price)} c/u</span>
                                    </td>
                                    <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                                    <td className="py-2 text-right tabular-nums">{money(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <dl className="mt-4 space-y-1 text-sm">
                        <div className="flex justify-between text-base font-semibold">
                            <dt>Total</dt>
                            <dd className="tabular-nums">{money(sale.total)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Forma de pago</dt>
                            <dd>{sale.payment_method.label}</dd>
                        </div>
                        {sale.cash_received !== null && (
                            <>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Efectivo recibido</dt>
                                    <dd className="tabular-nums">{money(sale.cash_received)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Cambio</dt>
                                    <dd className="tabular-nums">{money(sale.change ?? 0)}</dd>
                                </div>
                            </>
                        )}
                        {sale.customer && (
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Cliente</dt>
                                <dd>{sale.customer}</dd>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Atendió</dt>
                            <dd>{sale.seller ?? '—'}</dd>
                        </div>
                        {sale.notes && <p className="pt-2 text-muted-foreground">Nota: {sale.notes}</p>}
                    </dl>

                    {cancelled && (
                        <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            Cancelada por {sale.cancelled_by ?? '—'}
                            {sale.cancelled_at && ` el ${new Date(sale.cancelled_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`}: {sale.cancel_reason}
                        </p>
                    )}
                </article>
            </div>

            {cancelling && <CancelSaleDialog sale={sale} onClose={() => setCancelling(false)} />}
            {emailing && <EmailTicketDialog sale={sale} onClose={() => setEmailing(false)} />}
        </>
    );
}

SaleShowPage.layout = {
    breadcrumbs: [
        { title: 'Ventas', href: '/pos/ventas' },
        { title: 'Ticket', href: '#' },
    ],
};
