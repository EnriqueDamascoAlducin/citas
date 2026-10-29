import { Link, router, usePage } from '@inertiajs/react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { dashboard } from '@/routes/admin';

const DEFAULT_LOGO = '/storage/images/logo.png';

export const btnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-sm bg-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

export const btnGhost =
    'inline-flex items-center justify-center gap-2 rounded-sm border border-stone-700 px-5 py-2.5 text-sm font-medium text-stone-200 transition-colors hover:border-stone-500 hover:text-white disabled:opacity-50 cursor-pointer';

export const inputClass =
    'block w-full rounded-sm border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none';

type Customer = { name: string } | null | undefined;

export function SiteHeader({ logoImage, links }: { logoImage?: string; links?: Array<{ href: string; label: string }> }) {
    const { auth } = usePage().props as { auth: { user?: unknown; customer?: Customer } };

    return (
        <header className="border-b border-stone-800">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
                <Link href="/" className="shrink-0">
                    <img src={logoImage || DEFAULT_LOGO} alt="Inicio" className="h-9 w-auto" />
                </Link>

                <nav className="flex items-center gap-5 text-sm">
                    {links?.map((link) => (
                        <a key={link.href} href={link.href} className="hidden text-stone-400 transition-colors hover:text-stone-100 md:inline">
                            {link.label}
                        </a>
                    ))}

                    {auth.user ? (
                        <Link href={dashboard()} className="text-stone-300 underline-offset-4 hover:text-amber-400 hover:underline">
                            Panel
                        </Link>
                    ) : auth.customer ? (
                        <>
                            <Link href="/mi-cuenta" className="text-stone-300 hover:text-amber-400">
                                Mis citas
                            </Link>
                            <button
                                type="button"
                                onClick={() => router.post('/cliente/logout')}
                                className="cursor-pointer text-stone-500 hover:text-stone-200"
                            >
                                Salir
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/cliente/login" className="text-stone-300 hover:text-amber-400">
                                Entrar
                            </Link>
                            <Link href="/cliente/register" className="hidden text-stone-300 hover:text-amber-400 sm:inline">
                                Crear cuenta
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}

export function SiteFooter({ logoImage }: { logoImage?: string }) {
    return (
        <footer className="border-t border-stone-800">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <img src={logoImage || DEFAULT_LOGO} alt="" className="h-7 w-auto opacity-70" />
                <p>© {new Date().getFullYear()}. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
}

export function SiteLayout({ logoImage, links, children }: { logoImage?: string; links?: Array<{ href: string; label: string }>; children: ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-stone-950 text-stone-100">
            <SiteHeader logoImage={logoImage} links={links} />
            <main className="flex-1">{children}</main>
            <SiteFooter logoImage={logoImage} />
        </div>
    );
}

export function Field({
    label,
    error,
    ...props
}: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm text-stone-300">{label}</span>
            <input {...props} className={inputClass} />
            {error && <span className="mt-1.5 block text-sm text-red-400">{error}</span>}
        </label>
    );
}

/** Rótulo de sección en tipografía condensada, alineado a la izquierda. */
export function SectionTitle({ title, aside }: { title: string; aside?: ReactNode }) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-800 pb-4">
            <h2 className="font-display text-3xl font-semibold uppercase tracking-wide sm:text-4xl">{title}</h2>
            {aside && <div className="text-sm text-stone-400">{aside}</div>}
        </div>
    );
}

export function formatPrice(value: string | number): string {
    return `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
