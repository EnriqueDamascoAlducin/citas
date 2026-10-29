import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { PermissionOption, UserItem } from './types';

type Props = {
    user: UserItem;
    catalog: PermissionOption[];
    roleLabel: string | null;
    onClose: () => void;
};

export default function UserPermissionsDialog({ user, catalog, roleLabel, onClose }: Props) {
    const form = useForm<{ permissions: string[] }>({ permissions: user.direct_permissions });
    const fromRole = new Set(user.role_permissions);
    const groups = [...new Set(catalog.map((p) => p.group))];

    function toggle(name: string, checked: boolean) {
        form.setData('permissions', checked ? [...form.data.permissions, name] : form.data.permissions.filter((p) => p !== name));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/admin/users/${user.id}/permissions`, { preserveScroll: true, onSuccess: onClose });
    }

    const errors = Object.entries(form.errors).filter(([key]) => key.startsWith('permissions'));

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Permisos de {user.name}</DialogTitle>
                    <DialogDescription>
                        {roleLabel ? `Lo marcado como "por rol" viene de ${roleLabel} y se cambia cambiando el rol.` : 'Este usuario no tiene rol: solo tendrá lo que marques aquí.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5">
                    {groups.map((group) => (
                        <fieldset key={group}>
                            <legend className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">{group}</legend>
                            <div className="divide-y rounded-md border">
                                {catalog
                                    .filter((p) => p.group === group)
                                    .map((permission) => {
                                        const inherited = fromRole.has(permission.name);
                                        const checked = inherited || form.data.permissions.includes(permission.name);
                                        const disabled = inherited || !permission.grantable;
                                        const id = `perm-${permission.name}`;

                                        return (
                                            <label key={permission.name} htmlFor={id} className={`flex items-center gap-3 px-3 py-2.5 text-sm ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'}`}>
                                                <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(value) => toggle(permission.name, value === true)} />
                                                <span className={`flex-1 ${disabled && !inherited ? 'text-muted-foreground' : ''}`}>{permission.label}</span>
                                                {inherited && <span className="text-xs text-muted-foreground">por rol</span>}
                                                {!inherited && !permission.grantable && <span className="text-xs text-muted-foreground">no puedes otorgarlo</span>}
                                            </label>
                                        );
                                    })}
                            </div>
                        </fieldset>
                    ))}

                    {errors.length > 0 && <p className="text-sm text-destructive">{errors[0][1]}</p>}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Guardar permisos
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
