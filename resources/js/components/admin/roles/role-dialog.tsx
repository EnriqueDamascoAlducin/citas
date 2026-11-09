import { useForm } from '@inertiajs/react';
import type { PermissionOption } from '@/components/admin/users/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RoleItem } from './types';

type Props = {
    role: RoleItem | null;
    catalog: PermissionOption[];
    onClose: () => void;
};

export default function RoleDialog({ role, catalog, onClose }: Props) {
    const form = useForm<{ name: string; permissions: string[] }>({
        name: role?.name ?? '',
        permissions: role?.permissions ?? [],
    });
    const groups = [...new Set(catalog.map((p) => p.group))];
    const renamable = !role?.system;

    function toggle(name: string, checked: boolean) {
        form.setData((data) => ({
            ...data,
            permissions: checked ? [...data.permissions, name] : data.permissions.filter((p) => p !== name),
        }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };

        if (role) {
            form.transform((data) => (renamable ? data : { permissions: data.permissions }));
            form.put(`/admin/roles/${role.id}`, options);
        } else {
            form.post('/admin/roles', options);
        }
    }

    const permissionError = Object.entries(form.errors).find(([key]) => key.startsWith('permissions'))?.[1];

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{role ? `Rol ${role.label}` : 'Nuevo rol'}</DialogTitle>
                    <DialogDescription>
                        {role
                            ? `Los cambios aplican a ${role.users_count === 1 ? 'la persona que lo tiene' : `las ${role.users_count} personas que lo tienen`} al momento.`
                            : 'Ponle un nombre y marca lo que podrá hacer quien tenga este rol.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5">
                    {renamable ? (
                        <div className="grid gap-2">
                            <Label htmlFor="role-name">Nombre</Label>
                            <Input
                                id="role-name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="Ej. Recepción"
                                maxLength={50}
                                required
                                autoFocus
                            />
                            {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
                        </div>
                    ) : (
                        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Es un rol del sistema: puedes cambiar sus permisos, pero no su nombre.</p>
                    )}

                    {groups.map((group) => (
                        <fieldset key={group}>
                            <legend className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">{group}</legend>
                            <div className="divide-y rounded-md border">
                                {catalog
                                    .filter((p) => p.group === group)
                                    .map((permission) => {
                                        const checked = form.data.permissions.includes(permission.name);
                                        // Un permiso que no tienes no lo puedes dar, pero tampoco quitar si ya estaba.
                                        const disabled = !permission.grantable;
                                        const id = `role-perm-${permission.name}`;

                                        return (
                                            <label
                                                key={permission.name}
                                                htmlFor={id}
                                                className={`flex items-center gap-3 px-3 py-2.5 text-sm ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'}`}
                                            >
                                                <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(value) => toggle(permission.name, value === true)} />
                                                <span className={`flex-1 ${disabled ? 'text-muted-foreground' : ''}`}>{permission.label}</span>
                                                {disabled && <span className="text-xs text-muted-foreground">no puedes darlo</span>}
                                            </label>
                                        );
                                    })}
                            </div>
                        </fieldset>
                    ))}

                    {permissionError && <p className="text-sm text-destructive">{permissionError}</p>}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {role ? 'Guardar cambios' : 'Crear rol'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
