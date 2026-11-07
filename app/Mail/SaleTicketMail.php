<?php

namespace App\Mail;

use App\Models\Sale;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Ticket de una venta de mostrador enviado al cliente.
 */
class SaleTicketMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Sale $sale) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Tu ticket de compra {$this->sale->folio()}",
        );
    }

    public function content(): Content
    {
        $this->sale->loadMissing(['items', 'seller', 'customer']);
        $cash = $this->sale->cash_received !== null ? (float) $this->sale->cash_received : null;

        return new Content(
            markdown: 'mail.sale-ticket',
            with: [
                'sale' => $this->sale,
                'date' => $this->sale->created_at->locale('es')->translatedFormat('j \d\e F \d\e Y, H:i'),
                'change' => $cash !== null ? $cash - (float) $this->sale->total : null,
                'money' => fn ($value) => '$'.number_format((float) $value, 2),
            ],
        );
    }
}
