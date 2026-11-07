import { useForm } from '@inertiajs/react';
import type { SaleData } from '@/components/pos/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { money } from '@/lib/money';

interface CancelSaleDialogProps {
    sale: SaleData;
    onClose: () => void;
}

export default function CancelSaleDialog({ sale, onClose }: CancelSaleDialogProps) {
    const form = useForm({ reason: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(`/pos/ventas/${sale.id}/cancelar`, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancelar venta {sale.folio}</DialogTitle>
                    <DialogDescription>
                        La venta de {money(sale.total)} queda como cancelada y sus productos regresan al inventario. No se borra del historial.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="cancel-reason">Motivo</Label>
                        <Input id="cancel-reason" value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} placeholder="Ej. el cliente devolvió el producto" required autoFocus />
                        {form.errors.reason && <p className="text-sm text-destructive">{form.errors.reason}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Volver
                        </Button>
                        <Button type="submit" variant="destructive" disabled={form.processing}>
                            Cancelar venta
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
