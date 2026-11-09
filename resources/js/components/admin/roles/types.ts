export type RoleItem = {
    id: number;
    name: string;
    label: string;
    /** Rol del que depende el sistema: no se renombra ni se elimina. */
    system: boolean;
    /** Administrador: tampoco se le cambian los permisos. */
    locked: boolean;
    users_count: number;
    permissions: string[];
};
