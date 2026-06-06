import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Form } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UserItem = {
    id: number;
    name: string;
    email: string;
    roles: Array<{ name: string }>;
};

interface PageProps {
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
}

export default function UsersIndex({ users, roles }: PageProps) {
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);

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
            <Head title="Usuarios" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Usuarios" description="Gestiona los usuarios y sus roles" />
                    <Button onClick={openCreate}>Nuevo Usuario</Button>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                                <th className="px-4 py-3 text-left font-medium">Email</th>
                                <th className="px-4 py-3 text-left font-medium">Rol</th>
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((user) => (
                                <tr key={user.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">{user.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                    <td className="px-4 py-3">
                                        {user.roles.map((r) => (
                                            <Badge key={r.name} variant="secondary">{r.name}</Badge>
                                        ))}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="outline" size="sm" onClick={() => openEdit(user)}>Editar</Button>
                                        <Button variant="destructive" size="sm" className="ml-2" onClick={() => deleteUser(user)}>Eliminar</Button>
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

                {users.meta.total > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Mostrando {users.meta.from}-{users.meta.to} de {users.meta.total}</span>
                        <div className="flex gap-2">
                            {Array.from({ length: users.meta.last_page }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === users.meta.current_page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => router.get(`/admin/users?page=${page}`)}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={showModal} onOpenChange={(open) => { if (!open) closeModal(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? 'Actualiza los datos del usuario.' : 'Crea un nuevo usuario y asígnale un rol.'}
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
                                    <Label>Nombre</Label>
                                    <Input name="name" defaultValue={editingUser?.name ?? ''} required />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <Input name="email" type="email" defaultValue={editingUser?.email ?? ''} required />
                                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Rol</Label>
                                    <select
                                        name="role"
                                        defaultValue={editingUser?.roles[0]?.name ?? ''}
                                        className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                                        required
                                    >
                                        <option value="" disabled>Seleccionar rol</option>
                                        {roles.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                    {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Contraseña {editingUser && '(dejar vacío para mantener)'}</Label>
                                    <Input name="password" type="password" autoComplete="new-password" />
                                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
                                    <Button type="submit" disabled={processing}>Guardar</Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Usuarios', href: '/admin/users' }],
};
