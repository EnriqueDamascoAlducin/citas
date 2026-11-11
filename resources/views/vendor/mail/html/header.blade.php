@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
{{-- Logo del negocio, el mismo del sitio público. --}}
<img src="{{ asset('images/logo-email.png') }}" class="logo" alt="{{ config('app.name') }}" style="height: 64px; width: auto; max-height: 64px;">
</a>
</td>
</tr>
