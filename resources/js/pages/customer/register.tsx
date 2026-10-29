import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Field, SiteLayout, btnPrimary } from '@/components/site/site-shell';

export default function CustomerRegister() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});
        router.post('/cliente/register', form, {
            preserveState: true,
            onError: (err) => setErrors(err),
        });
    }

    return (
        <>
            <Head title="Crear cuenta" />
            <SiteLayout>
                <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
                    <h1 className="font-display text-5xl font-bold uppercase">Crear cuenta</h1>
                    <p className="mt-2 text-stone-400">Para agendar y pagar tus citas en línea.</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                        <Field label="Nombre" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
                        <Field label="Correo electrónico" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
                        <Field
                            label="Teléfono (WhatsApp)"
                            type="tel"
                            autoComplete="tel"
                            required
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            error={errors.phone}
                            placeholder="+52 555 123 4567"
                        />
                        <p className="-mt-2 text-xs text-stone-500">Ahí te enviamos la confirmación y el recordatorio de tus citas.</p>
                        <Field label="Contraseña" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} placeholder="Mínimo 8 caracteres" />
                        <Field label="Confirmar contraseña" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
                        <button type="submit" className={`${btnPrimary} w-full py-3`}>
                            Crear cuenta
                        </button>
                    </form>

                    <p className="mt-8 border-t border-stone-800 pt-6 text-sm text-stone-400">
                        ¿Ya tienes cuenta?{' '}
                        <Link href="/cliente/login" className="text-amber-500 hover:text-amber-400">
                            Entra aquí
                        </Link>
                    </p>
                </div>
            </SiteLayout>
        </>
    );
}
