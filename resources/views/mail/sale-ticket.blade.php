<x-mail::message>
# Gracias por tu compra

@if ($sale->customer)
Hola {{ strtok($sale->customer->name, ' ') }}, este es el ticket de tu compra.
@else
Este es el ticket de tu compra.
@endif

**Folio:** {{ $sale->folio() }}<br>
**Fecha:** {{ $date }}

<x-mail::table>
| Producto | Cant. | Importe |
|:---------|:-----:|--------:|
@foreach ($sale->items as $item)
| {{ $item->product_name }} ({{ $money($item->unit_price) }} c/u) | {{ $item->quantity }} | {{ $money($item->total) }} |
@endforeach
| **Total** | | **{{ $money($sale->total) }}** |
</x-mail::table>

**Forma de pago:** {{ $sale->payment_method->label() }}
@if ($sale->cash_received !== null)
<br>**Efectivo recibido:** {{ $money($sale->cash_received) }}<br>
**Cambio:** {{ $money($change) }}
@endif
@if ($sale->seller)
<br>**Te atendió:** {{ $sale->seller->name }}
@endif

@if ($sale->isCancelled())
<x-mail::panel>
Esta venta fue cancelada{{ $sale->cancel_reason ? ': '.$sale->cancel_reason : '' }}.
</x-mail::panel>
@endif

Gracias,<br>
{{ config('app.name') }}
</x-mail::message>
