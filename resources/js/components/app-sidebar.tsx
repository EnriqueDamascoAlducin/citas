import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Calendar, FolderGit2, LayoutGrid, Scissors, Package, CalendarCheck, Users, ContactRound } from 'lucide-react';
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
import { dashboard } from '@/routes/admin';
import type { NavItem } from '@/types';

const baseNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Creator',
        href: 'https://myflight.com.mx',
        icon: FolderGit2,
    }
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const isLoggedIn = !!auth.user;

    const extraNavItems: NavItem[] = [];

    if (isLoggedIn) {
        extraNavItems.push(
            {
                title: 'Mi Horario',
                href: '/employee/schedule',
                icon: Calendar,
            },
            {
                title: 'Citas',
                href: '/employee/appointments',
                icon: CalendarCheck,
            },
            {
                title: 'Servicios',
                href: '/admin/services',
                icon: Scissors,
            },
            {
                title: 'Productos',
                href: '/admin/products',
                icon: Package,
            },
            {
                title: 'Usuarios',
                href: '/admin/users',
                icon: Users,
            },
            {
                title: 'Clientes',
                href: '/admin/customers',
                icon: ContactRound,
            },
        );
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={[...baseNavItems, ...extraNavItems]} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
