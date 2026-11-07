import { Head, router, useForm } from '@inertiajs/react';
import { Minus, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { money } from '@/lib/money';
import { cn } from '@/lib/utils';

type Product = { id: number; name: string; price: number; stock: number; category_id: number | null };
type Option = { value: string; label: string };
type CustomerOption = { id: number; name: string; phone: string | null };

interface PointOfSalePageProps {
    products: Product[];
    categories: Array<{ id: number; name: string }>;
    paymentMethods: Option[];
    customers: CustomerOption[];
}

type SaleForm = {
    items: Array<{ id: number; quantity: number }>;
    payment_method: string;
    customer_id: number | null;
    cash_received: string;
    notes: string;
};

export default function PointOfSalePage({ products, categories, paymentMethods, customers }: PointOfSalePageProps) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<number | null>(null);
    const [customerQuery, setCustomerQuery] = useState('');
    const [customer, setCustomer] = useState<CustomerOption | null>(null);
    const ticketRef = useRef<HTMLDivElement>(null);

    const form = useForm<SaleForm>({ items: [], payment_method: 'cash', customer_id: null, cash_received: '', notes: '' });

    const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
    const visible = products.filter(
        (p) => (category === null || p.category_id === category) && p.name.toLowerCase().includes(search.trim().toLowerCase()),
    );

    const lines = form.data.items.map((item) => ({ ...item, product: byId.get(item.id)! })).filter((l) => l.product);
    const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
    const units = lines.reduce((sum, l) => sum + l.quantity, 0);
    const cash = Number(form.data.cash_received || 0);
    const change = form.data.payment_method === 'cash' && form.data.cash_received !== '' ? cash - total : null;

    // Busca clientes en el servidor solo con lo necesario (recarga parcial).
    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (customerQuery.trim().length >= 2) {
                router.reload({ only: ['customers'], data: { cliente: customerQuery.trim() } });
            }
        }, 300);

        return () => window.clearTimeout(timer);
    }, [customerQuery]);

    function quantityOf(id: number) {
        return form.data.items.find((i) => i.id === id)?.quantity ?? 0;
    }

    // Siempre sobre el ticket más reciente: dos toques seguidos no se pisan.
    function changeQuantity(id: number, update: (current: number) => number) {
        const max = byId.get(id)?.stock ?? 0;

        form.setData((data) => {
            const current = data.items.find((i) => i.id === id)?.quantity ?? 0;
            const next = Math.max(0, Math.min(update(current), max));
            const rest = data.items.filter((i) => i.id !== id);
            const items = next === 0 ? rest : current > 0 ? data.items.map((i) => (i.id === id ? { ...i, quantity: next } : i)) : [...data.items, { id, quantity: next }];

            return { ...data, items };
        });
    }

    function setQuantity(id: number, quantity: number) {
        changeQuantity(id, () => quantity);
    }

    function pickCustomer(option: CustomerOption | null) {
        setCustomer(option);
        form.setData('customer_id', option?.id ?? null);
        setCustomerQuery('');
    }

    function submit() {
        form.post('/pos/ventas', { preserveScroll: true });
    }

    return (
        <>
            <Head title="Punto de venta" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 pb-28 lg:flex-row lg:items-start lg:pb-4">
                {/* Catálogo */}
                <section className="flex-1 space-y-4">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto" className="h-11 pl-9" />
                    </div>

                    {categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {[{ id: null, name: 'Todos' }, ...categories].map((c) => (
                                <button
                                    key={c.id ?? 'all'}
                                    type="button"
                                    onClick={() => setCategory(c.id)}
                                    className={cn(
                                        'cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors',
                                        category === c.id ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                                    )}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {visible.map((product) => {
                            const inCart = quantityOf(product.id);
                            const soldOut = product.stock - inCart <= 0;

                            return (
                                <button
                                    key={product.id}
                                    type="button"
                                    disabled={soldOut}
                                    onClick={() => changeQuantity(product.id, (q) => q + 1)}
                                    className={cn(
                                        'relative flex min-h-24 cursor-pointer flex-col justify-between rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50',
                                        inCart > 0 && 'border-primary',
                                    )}
                                >
                                    <span className="line-clamp-2 text-sm font-medium">{product.name}</span>
                                    <span className="mt-2 flex items-end justify-between gap-2">
                                        <span className="font-semibold text-primary tabular-nums">{money(product.price)}</span>
                                        <span className={cn('text-xs tabular-nums', product.stock <= 5 ? 'text-amber-500' : 'text-muted-foreground')}>
                                            {product.stock === 0 ? 'Agotado' : `${product.stock - inCart} disp.`}
                                        </span>
                                    </span>
                                    {inCart > 0 && (
                                        <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                            {inCart}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                        {visible.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No hay productos con ese nombre.</p>}
                    </div>
                </section>

                {/* Ticket */}
                <aside ref={ticketRef} className="w-full space-y-4 rounded-lg border bg-card p-4 lg:sticky lg:top-4 lg:w-96">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Ticket</h2>
                        {lines.length > 0 && (
                            <button type="button" onClick={() => form.setData('items', [])} className="cursor-pointer text-xs text-muted-foreground hover:text-destructive">
                                Vaciar
                            </button>
                        )}
                    </div>

                    {lines.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Toca un producto para agregarlo.</p>
                    ) : (
                        <ul className="divide-y">
                            {lines.map((line) => (
                                <li key={line.id} className="flex items-center gap-2 py-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{line.product.name}</p>
                                        <p className="text-xs text-muted-foreground tabular-nums">
                                            {money(line.product.price)} × {line.quantity}
                                        </p>
                                    </div>
                                    <div className="flex items-center rounded-md border">
                                        <button type="button" aria-label={`Quitar uno de ${line.product.name}`} onClick={() => changeQuantity(line.id, (q) => q - 1)} className="cursor-pointer p-1.5 hover:bg-accent">
                                            <Minus className="size-3.5" />
                                        </button>
                                        <span className="w-7 text-center text-sm tabular-nums">{line.quantity}</span>
                                        <button
                                            type="button"
                                            aria-label={`Agregar uno de ${line.product.name}`}
                                            disabled={line.quantity >= line.product.stock}
                                            onClick={() => changeQuantity(line.id, (q) => q + 1)}
                                            className="cursor-pointer p-1.5 hover:bg-accent disabled:opacity-40"
                                        >
                                            <Plus className="size-3.5" />
                                        </button>
                                    </div>
                                    <span className="w-20 text-right text-sm font-medium tabular-nums">{money(line.product.price * line.quantity)}</span>
                                    <button type="button" aria-label={`Quitar ${line.product.name}`} onClick={() => setQuantity(line.id, 0)} className="cursor-pointer p-1 text-muted-foreground hover:text-destructive">
                                        <Trash2 className="size-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="flex items-baseline justify-between border-t pt-3">
                        <span className="text-sm text-muted-foreground">Total ({units} {units === 1 ? 'pieza' : 'piezas'})</span>
                        <span className="text-2xl font-bold tabular-nums">{money(total)}</span>
                    </div>

                    {/* Cliente opcional */}
                    <div className="space-y-1.5">
                        <Label>Cliente (opcional)</Label>
                        {customer ? (
                            <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                                <span>
                                    {customer.name}
                                    {customer.phone && <span className="ml-2 text-muted-foreground">{customer.phone}</span>}
                                </span>
                                <button type="button" aria-label="Quitar cliente" onClick={() => pickCustomer(null)} className="cursor-pointer text-muted-foreground hover:text-foreground">
                                    <X className="size-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Input value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} placeholder="Nombre, correo o teléfono" />
                                {customerQuery.trim().length >= 2 && customers.length > 0 && (
                                    <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                                        {customers.map((c) => (
                                            <li key={c.id}>
                                                <button type="button" onClick={() => pickCustomer(c)} className="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-accent">
                                                    {c.name}
                                                    {c.phone && <span className="ml-2 text-muted-foreground">{c.phone}</span>}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Forma de pago */}
                    <div className="space-y-1.5">
                        <Label>Forma de pago</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {paymentMethods.map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => form.setData('payment_method', m.value)}
                                    className={cn(
                                        'cursor-pointer rounded-md border px-2 py-2 text-sm transition-colors',
                                        form.data.payment_method === m.value ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.data.payment_method === 'cash' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="cash-received">Efectivo recibido</Label>
                            <Input
                                id="cash-received"
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.01"
                                value={form.data.cash_received}
                                onChange={(e) => form.setData('cash_received', e.target.value)}
                                placeholder={total ? total.toFixed(2) : '0.00'}
                            />
                            {change !== null && (
                                <p className={cn('text-sm font-medium tabular-nums', change < 0 ? 'text-destructive' : 'text-emerald-500')}>
                                    {change < 0 ? `Faltan ${money(-change)}` : `Cambio: ${money(change)}`}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="sale-notes">Nota (opcional)</Label>
                        <Input id="sale-notes" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} maxLength={500} />
                    </div>

                    {Object.keys(form.errors).length > 0 && (
                        <div className="space-y-1 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            {Object.values(form.errors).map((message) => (
                                <p key={message}>{message}</p>
                            ))}
                        </div>
                    )}

                    <Button className="h-12 w-full text-base" disabled={lines.length === 0 || form.processing || (change !== null && change < 0)} onClick={submit}>
                        {form.processing ? 'Cobrando…' : `Cobrar ${money(total)}`}
                    </Button>
                </aside>
            </div>

            {/* En celular el total queda a la vista mientras se eligen productos. */}
            {lines.length > 0 && (
                <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 border-t bg-background p-4 lg:hidden">
                    <span className="text-sm">
                        {units} {units === 1 ? 'pieza' : 'piezas'} · <strong className="tabular-nums">{money(total)}</strong>
                    </span>
                    <Button onClick={() => ticketRef.current?.scrollIntoView({ behavior: 'smooth' })}>Ver ticket</Button>
                </div>
            )}
        </>
    );
}

PointOfSalePage.layout = {
    breadcrumbs: [{ title: 'Punto de venta', href: '/pos' }],
};
