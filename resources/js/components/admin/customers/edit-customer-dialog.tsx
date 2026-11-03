import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type EditableCustomer = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
};

interface EditCustomerDialogProps {
    customer: EditableCustomer;
    onClose: () => void;
}

export default function EditCustomerDialog({ customer, onClose }: EditCustomerDialogProps) {
    const form = useForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? '',
        password: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/admin/customers/${customer.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar cliente</DialogTitle>
                    <DialogDescription>El teléfono es al que le llegan la confirmación y el recordatorio por WhatsApp.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="customer-name">Nombre</Label>
                        <Input id="customer-name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                        {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="customer-email">Correo</Label>
                        <Input id="customer-email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} required />
                        {form.errors.email && <p className="text-sm text-destructive">{form.errors.email}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="customer-phone">Teléfono (WhatsApp)</Label>
                        <Input
                            id="customer-phone"
                            type="tel"
                            value={form.data.phone}
                            onChange={(e) => form.setData('phone', e.target.value)}
                            placeholder="+52 555 123 4567"
                            required
                        />
                        {form.errors.phone && <p className="text-sm text-destructive">{form.errors.phone}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="customer-password">Nueva contraseña (déjala vacía para mantenerla)</Label>
                        <Input
                            id="customer-password"
                            type="password"
                            autoComplete="new-password"
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                        />
                        {form.errors.password && <p className="text-sm text-destructive">{form.errors.password}</p>}
                    </div>

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
