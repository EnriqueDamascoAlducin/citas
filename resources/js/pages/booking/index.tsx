import { Head, usePage } from '@inertiajs/react';
import BookingWizard from '@/components/booking-wizard';

type Service = {
    id: number;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: string | number;
};

type ProductCategory = {
    id: number;
    name: string;
    description: string | null;
    products: Array<{
        id: number;
        name: string;
        description: string | null;
        price: number;
        stock: number;
    }>;
};

interface PageProps {
    services: Service[];
    productCategories: ProductCategory[];
}

export default function BookingIndex({ services, productCategories }: PageProps) {
    const params = new URLSearchParams(window.location.search);
    const initialServiceId = params.get('service_id') ? Number(params.get('service_id')) : undefined;
    const initialEmployeeId = params.get('employee_id') ? Number(params.get('employee_id')) : undefined;

    return (
        <>
            <Head title="Agendar Cita" />

            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Agenda tu Cita</h1>
                    <p className="mt-2 text-muted-foreground">
                        Selecciona fecha, servicio y horario para tu visita
                    </p>
                </div>

                <BookingWizard
                    services={services}
                    productCategories={productCategories}
                    initialServiceId={initialServiceId}
                    initialEmployeeId={initialEmployeeId}
                />
            </div>
        </>
    );
}

BookingIndex.layout = {
    breadcrumbs: [
        { title: 'Agendar Cita', href: '/booking' },
    ],
};
