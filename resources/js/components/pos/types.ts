export type SaleItemLine = { name: string; quantity: number; unit_price: number; total: number };

export type SaleData = {
    id: number;
    folio: string;
    created_at: string;
    seller: string | null;
    customer: string | null;
    customer_email: string | null;
    emailed_to: string | null;
    emailed_at: string | null;
    payment_method: { value: string; label: string };
    total: number;
    cash_received: number | null;
    change: number | null;
    status: 'completed' | 'cancelled';
    notes: string | null;
    items_count?: number;
    items?: SaleItemLine[];
    cancelled_at: string | null;
    cancelled_by: string | null;
    cancel_reason: string | null;
    can_cancel: boolean;
};

export type PageMeta = { current_page: number; last_page: number; from: number | null; to: number | null; total: number };
