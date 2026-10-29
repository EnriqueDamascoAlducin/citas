export type UserItem = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    is_super_admin: boolean;
    role_permissions: string[];
    direct_permissions: string[];
};

export type PermissionOption = {
    name: string;
    label: string;
    group: string;
    grantable: boolean;
};
