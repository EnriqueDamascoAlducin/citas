import { Head, router } from '@inertiajs/react';
import { Lock, Users } from 'lucide-react';
import { useState } from 'react';
import RoleDialog from '@/components/admin/roles/role-dialog';
import type { RoleItem } from '@/components/admin/roles/types';
import type { PermissionOption } from '@/components/admin/users/types';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RolesIndexPageProps {
    roles: RoleItem[];
    permissionCatalog: PermissionOption[];
}

export default function RolesIndex({ roles, permissionCatalog }: RolesIndexPageProps) {
    // undefined = cerrado, null = nuevo rol.
    const [editing, setEditing] = useState<RoleItem | null | undefined>(undefined);
    const labels = new Map(permissionCatalog.map((p) => [p.name, p.label]));

    function deleteRole(role: RoleItem) {
        if (confirm(`¿Eliminar el rol "${role.label}"?`)) {
            router.delete(`/admin/roles/${role.id}`, { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Roles" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Heading
                        title="Roles"
                        description="Un rol es un paquete de permisos. Asígnalo a las personas desde Usuarios y permisos; si cambias el rol, cambia para todas."
                    />
                    <Button onClick={() => setEditing(null)}>Nuevo rol</Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {roles.map((role) => (
                        <div key={role.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-semibold">{role.label}</h3>
                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Users className="size-3.5" />
                                        {role.users_count === 1 ? '1 persona' : `${role.users_count} personas`}
                                    </p>
                                </div>
                                {role.system && (
                                    <Badge variant="secondary" className="gap-1">
                                        <Lock className="size-3" />
                                        Sistema
                                    </Badge>
                                )}
                            </div>

                            <div className="flex flex-1 flex-wrap content-start gap-1">
                                {role.permissions.length > 0 ? (
                                    role.permissions.map((name) => (
                                        <Badge key={name} variant="outline" className="font-normal">
                                            {labels.get(name) ?? name}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground">Sin permisos</span>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-1 border-t pt-3">
                                {role.locked ? (
                                    <span className="text-xs text-muted-foreground">Sus permisos no se editan para no dejar al negocio sin acceso.</span>
                                ) : (
                                    <>
                                        {!role.system && (
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteRole(role)}>
                                                Eliminar
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => setEditing(role)}>
                                            Editar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {editing !== undefined && <RoleDialog key={editing?.id ?? 'new'} role={editing} catalog={permissionCatalog} onClose={() => setEditing(undefined)} />}
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [{ title: 'Roles', href: '/admin/roles' }],
};
