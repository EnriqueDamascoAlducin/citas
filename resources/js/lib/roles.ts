// Roles del sistema guardados con clave técnica; los que crea el negocio se muestran con su nombre tal cual.
const SYSTEM_ROLE_LABEL: Record<string, string> = {
    'super-admin': 'Super admin',
    admin: 'Administrador',
    employee: 'Barbero',
    client: 'Cliente',
};

export function roleLabel(name: string): string {
    return SYSTEM_ROLE_LABEL[name] ?? name;
}
