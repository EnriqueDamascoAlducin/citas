export default function AppLogo() {
    return (
        <div className="flex items-center gap-2">
            {/* El ícono trae su propio fondo oscuro: se ve igual en el panel claro u oscuro. */}
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="text-sm font-semibold">MyTatoo Admin</span>
        </div>
    );
}
