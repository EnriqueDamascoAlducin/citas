import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function CustomerRegister() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    function handleSubmit() {
        setErrors({});
        router.post('/cliente/register', form, {
            preserveState: true,
            onError: (err) => setErrors(err),
        });
    }

    return (
        <>
            <Head title="Crear Cuenta - Clientes" />
            <div className="flex min-h-screen items-center justify-center bg-stone-950 px-4">
                <div className="w-full max-w-sm space-y-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-stone-100">Crear Cuenta</h1>
                        <p className="mt-1 text-sm text-stone-400">Regístrate para agendar tus citas</p>
                    </div>
                    <div className="space-y-4 rounded-xl border border-stone-800 bg-stone-900/50 p-6">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-stone-300">Nombre</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                placeholder="Tu nombre"
                            />
                            {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-stone-300">Correo electrónico</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                placeholder="tu@correo.com"
                            />
                            {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-stone-300">Teléfono</label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                placeholder="+52 555 123 4567"
                            />
                            {errors.phone && <p className="text-sm text-red-400">{errors.phone}</p>}
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-stone-300">Contraseña</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                placeholder="Mínimo 8 caracteres"
                            />
                            {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-stone-300">Confirmar contraseña</label>
                            <input
                                type="password"
                                value={form.password_confirmation}
                                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                placeholder="Repite la contraseña"
                            />
                        </div>
                        <button
                            onClick={handleSubmit}
                            className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-stone-900 hover:bg-amber-400 transition-colors"
                        >
                            Crear Cuenta
                        </button>
                        <p className="text-center text-sm text-stone-400">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/cliente/login" className="text-amber-400 hover:text-amber-300">Inicia sesión</Link>
                        </p>
                    </div>
                    <p className="text-center text-sm text-stone-500">
                        <Link href="/" className="hover:text-stone-300">← Volver al inicio</Link>
                    </p>
                </div>
            </div>
        </>
    );
}
