import { useForm } from '@inertiajs/react';
import type { SaleData } from '@/components/pos/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmailTicketDialogProps {
    sale: SaleData;
    onClose: () => void;
}

export default function EmailTicketDialog({ sale, onClose }: EmailTicketDialogProps) {
    // Propone el correo del cliente ligado o el último al que se envió.
    const form = useForm({ email: sale.customer_email ?? sale.emailed_to ?? '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(`/pos/ventas/${sale.id}/correo`, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enviar ticket {sale.folio}</DialogTitle>
                    <DialogDescription>El cliente recibe el detalle de su compra en su correo.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="ticket-email">Correo</Label>
                        <Input
                            id="ticket-email"
                            type="email"
                            autoComplete="email"
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                            placeholder="cliente@correo.com"
                            required
                            autoFocus
                        />
                        {form.errors.email && <p className="text-sm text-destructive">{form.errors.email}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Enviando…' : 'Enviar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
