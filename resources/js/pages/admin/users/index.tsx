import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PermissionOption, UserItem } from '@/components/admin/users/types';
import UserPermissionsDialog from '@/components/admin/users/user-permissions-dialog';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UsersIndexPageProps {
    users: {
        data: UserItem[];
        meta: {
            current_page: number;
            last_page: number;
            from: number;
            to: number;
            total: number;
        };
    };
    roles: string[];
    permissionCatalog: PermissionOption[];
}

const ROLE_LABEL: Record<string, string> = {
    'super-admin': 'Super admin',
    admin: 'Administrador',
    employee: 'Barbero',
    client: 'Cliente',
};

export default function UsersIndex({ users, roles, permissionCatalog }: UsersIndexPageProps) {
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [permissionsUser, setPermissionsUser] = useState<UserItem | null>(null);

    function openCreate() {
        setEditingUser(null);
        setShowModal(true);
    }

    function openEdit(user: UserItem) {
        setEditingUser(user);
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingUser(null);
    }

    function deleteUser(user: UserItem) {
        if (confirm(`¿Eliminar al usuario "${user.name}"?`)) {
            router.delete(`/admin/users/${user.id}`);
        }
    }

    return (
        <>
            <Head title="Usuarios y permisos" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Heading title="Usuarios y permisos" description="Cada persona del equipo entra con su propia cuenta y ve solo lo que le permites." />
                    <Button onClick={openCreate}>Nuevo usuario</Button>
                </div>

                <div className="overflow-x-auto rounded-lg border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-muted-foreground">
                                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                                <th className="px-4 py-3 text-left font-medium">Rol</th>
                                <th className="px-4 py-3 text-left font-medium">Permisos extra</th>
                                <th className="px-4 py-3 text-right font-medium">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((user) => (
                                <tr key={user.id} className="border-b last:border-0">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.role ? <Badge variant="secondary">{ROLE_LABEL[user.role] ?? user.role}</Badge> : <span className="text-muted-foreground">Sin rol</span>}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {user.is_super_admin ? 'Todos' : user.direct_permissions.length > 0 ? `${user.direct_permissions.length} asignado${user.direct_permissions.length > 1 ? 's' : ''}` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        {!user.is_super_admin && (
                                            <Button variant="outline" size="sm" onClick={() => setPermissionsUser(user)}>
                                                Permisos
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="ml-1" onClick={() => openEdit(user)}>
                                            Editar
                                        </Button>
                                        {!user.is_super_admin && (
                                            <Button variant="ghost" size="sm" className="ml-1 text-destructive" onClick={() => deleteUser(user)}>
                                                Eliminar
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        No hay usuarios registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {users.meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {users.meta.from}–{users.meta.to} de {users.meta.total}
                        </span>
                        <div className="flex gap-1">
                            {Array.from({ length: users.meta.last_page }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === users.meta.current_page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => router.get('/admin/users', { page }, { preserveScroll: true })}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Dialog
                open={showModal}
                onOpenChange={(open) => {
                    if (!open) {
                        closeModal();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? 'Actualiza los datos y el rol.' : 'El rol define lo básico; después puedes sumar permisos individuales.'}
                        </DialogDescription>
                    </DialogHeader>

                    <Form
                        action={editingUser ? `/admin/users/${editingUser.id}` : '/admin/users'}
                        method={editingUser ? 'put' : 'post'}
                        onSuccess={closeModal}
                        resetOnSuccess
                    >
                        {({ errors, processing }) => (
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="user-name">Nombre</Label>
                                    <Input id="user-name" name="name" defaultValue={editingUser?.name ?? ''} required />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="user-email">Correo</Label>
                                    <Input id="user-email" name="email" type="email" defaultValue={editingUser?.email ?? ''} required />
                                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="user-role">Rol</Label>
                                    <select
                                        id="user-role"
                                        name="role"
                                        defaultValue={editingUser?.role ?? ''}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        required
                                    >
                                        <option value="" disabled>
                                            Seleccionar rol
                                        </option>
                                        {roles.map((r) => (
                                            <option key={r} value={r}>
                                                {ROLE_LABEL[r] ?? r}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="user-password">Contraseña {editingUser && '(déjala vacía para mantenerla)'}</Label>
                                    <Input id="user-password" name="password" type="password" autoComplete="new-password" />
                                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={closeModal}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        Guardar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>

            {permissionsUser && (
                <UserPermissionsDialog
                    user={permissionsUser}
                    catalog={permissionCatalog}
                    roleLabel={permissionsUser.role ? (ROLE_LABEL[permissionsUser.role] ?? permissionsUser.role) : null}
                    onClose={() => setPermissionsUser(null)}
                />
            )}
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Usuarios y permisos', href: '/admin/users' }],
};
