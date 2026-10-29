import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Field, SiteLayout, btnPrimary } from '@/components/site/site-shell';

export default function CustomerLogin() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});
        router.post('/cliente/login', form, {
            preserveState: true,
            onError: (err) => setErrors(err),
        });
    }

    return (
        <>
            <Head title="Entrar" />
            <SiteLayout>
                <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
                    <h1 className="font-display text-5xl font-bold uppercase">Entrar</h1>
                    <p className="mt-2 text-stone-400">Consulta y paga tus citas.</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                        <Field
                            label="Correo electrónico"
                            type="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            error={errors.email}
                        />
                        <Field
                            label="Contraseña"
                            type="password"
                            autoComplete="current-password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            error={errors.password}
                        />
                        <button type="submit" className={`${btnPrimary} w-full py-3`}>
                            Entrar
                        </button>
                    </form>

                    <p className="mt-8 border-t border-stone-800 pt-6 text-sm text-stone-400">
                        ¿Primera vez?{' '}
                        <Link href="/cliente/register" className="text-amber-500 hover:text-amber-400">
                            Crea tu cuenta
                        </Link>
                    </p>
                </div>
            </SiteLayout>
        </>
    );
}
