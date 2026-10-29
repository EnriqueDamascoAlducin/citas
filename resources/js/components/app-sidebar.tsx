import { Link, usePage } from '@inertiajs/react';
import { BarChart3, Calendar, CalendarCheck, CalendarDays, ContactRound, FolderGit2, Package, Scissors, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

type GatedNavItem = NavItem & { permission: string | string[] };

const workItems: GatedNavItem[] = [
    { title: 'Mi agenda', href: '/profesional', icon: CalendarDays, permission: 'view-appointments' },
    { title: 'Mi horario', href: '/employee/schedule', icon: Calendar, permission: 'manage-schedule' },
];

const adminItems: GatedNavItem[] = [
    { title: 'Reportes', href: '/admin/dashboard', icon: BarChart3, permission: 'view-dashboard' },
    { title: 'Todas las citas', href: '/employee/appointments', icon: CalendarCheck, permission: 'view-any-appointment' },
    { title: 'Servicios', href: '/admin/services', icon: Scissors, permission: 'manage-services' },
    { title: 'Productos', href: '/admin/products', icon: Package, permission: 'manage-products' },
    { title: 'Usuarios y permisos', href: '/admin/users', icon: Users, permission: 'manage-employees' },
    { title: 'Clientes', href: '/admin/customers', icon: ContactRound, permission: 'manage-customers' },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Creator',
        href: 'https://myflight.com.mx',
        icon: FolderGit2,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const granted = new Set(auth.user?.permissions ?? []);
    const allowed = (items: GatedNavItem[]) =>
        items.filter((item) => [item.permission].flat().some((p) => granted.has(p)));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/panel" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain label="Mi trabajo" items={allowed(workItems)} />
                <NavMain label="Administración" items={allowed(adminItems)} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
