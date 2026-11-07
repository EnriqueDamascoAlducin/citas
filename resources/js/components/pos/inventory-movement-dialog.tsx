import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type InventoryProduct = { id: number; name: string; stock: number };

interface InventoryMovementDialogProps {
    product: InventoryProduct;
    onClose: () => void;
}

export default function InventoryMovementDialog({ product, onClose }: InventoryMovementDialogProps) {
    const form = useForm({ type: 'restock', quantity: '', count: String(product.stock), note: '' });
    const isRestock = form.data.type === 'restock';
    const preview = isRestock ? product.stock + Number(form.data.quantity || 0) : Number(form.data.count || 0);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(`/pos/inventario/${product.id}/movimientos`, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{product.name}</DialogTitle>
                    <DialogDescription>Hay {product.stock} en existencia. Cada cambio queda en el historial con tu nombre.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: 'restock', label: 'Entrada de mercancía' },
                            { value: 'adjustment', label: 'Ajuste por conteo' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => form.setData('type', option.value)}
                                className={cn(
                                    'cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors',
                                    form.data.type === option.value ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {isRestock ? (
                        <div className="grid gap-2">
                            <Label htmlFor="movement-quantity">Piezas que entraron</Label>
                            <Input id="movement-quantity" type="number" min="1" value={form.data.quantity} onChange={(e) => form.setData('quantity', e.target.value)} autoFocus required />
                            {form.errors.quantity && <p className="text-sm text-destructive">{form.errors.quantity}</p>}
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="movement-count">Piezas que contaste</Label>
                            <Input id="movement-count" type="number" min="0" value={form.data.count} onChange={(e) => form.setData('count', e.target.value)} autoFocus required />
                            {form.errors.count && <p className="text-sm text-destructive">{form.errors.count}</p>}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="movement-note">{isRestock ? 'Nota (opcional)' : 'Motivo'}</Label>
                        <Input
                            id="movement-note"
                            value={form.data.note}
                            onChange={(e) => form.setData('note', e.target.value)}
                            placeholder={isRestock ? 'Ej. pedido al proveedor' : 'Ej. merma, producto dañado, conteo mensual'}
                            required={!isRestock}
                        />
                        {form.errors.note && <p className="text-sm text-destructive">{form.errors.note}</p>}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Quedarán <strong className="text-foreground tabular-nums">{preview}</strong> en existencia.
                    </p>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Guardar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
