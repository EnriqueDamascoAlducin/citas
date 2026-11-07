const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** Monto en pesos: 1234.5 → "$1,234.50". */
export function money(value: number | string): string {
    return formatter.format(Number(value));
}

/** Fecha y hora corta en español: "7 nov, 14:05". */
export function shortDateTime(iso: string): string {
    return new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}
