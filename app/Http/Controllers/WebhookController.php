<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Exceptions\MPApiException;
use MercadoPago\MercadoPagoConfig;

class WebhookController extends Controller
{
    public function mpIpn(Request $request): JsonResponse
    {
        // Webhooks envían type + data.id (PHP convierte "data.id" del query en "data_id");
        // el IPN clásico envía topic + id.
        $topic = $request->input('type') ?? $request->query('topic');
        $id = $request->input('data.id') ?? $request->query('data_id') ?? $request->query('id');

        if ($topic !== 'payment' || ! $id) {
            return response()->json(['message' => 'ignored'], 200);
        }

        if (! $this->hasValidSignature($request, (string) $id)) {
            Log::warning('MP webhook con firma inválida', ['id' => $id, 'ip' => $request->ip()]);

            return response()->json(['message' => 'invalid signature'], 401);
        }

        MercadoPagoConfig::setAccessToken(config('services.mercadopago.access_token'));

        try {
            $mpPayment = (new PaymentClient)->get((int) $id);
        } catch (MPApiException $e) {
            Log::error('MP webhook: no se pudo consultar el pago', [
                'id' => $id,
                'status' => $e->getStatusCode(),
            ]);

            return response()->json(['message' => 'lookup failed'], 500);
        }

        $payment = Payment::where('mp_payment_id', (string) $id)->first();

        if (! $payment) {
            $payment = Payment::where('appointment_id', $mpPayment->external_reference)
                ->where('status', 'pending')
                ->first();
        }

        if (! $payment) {
            return response()->json(['message' => 'payment not found'], 404);
        }

        $payment->update([
            'mp_payment_id' => (string) $mpPayment->id,
            'status' => $mpPayment->status,
            'method' => $mpPayment->payment_method_id,
            'mp_response' => json_decode(json_encode($mpPayment), true),
        ]);

        if ($mpPayment->status === 'approved') {
            $payment->appointment->update(['status' => 'confirmed']);
        }

        return response()->json(['message' => 'ok']);
    }

    /**
     * Valida el header x-signature de Mercado Pago. Sin secreto configurado se acepta,
     * porque el estado siempre se vuelve a consultar en la API de MP.
     */
    private function hasValidSignature(Request $request, string $dataId): bool
    {
        $secret = config('services.mercadopago.webhook_secret');

        if (! $secret) {
            return true;
        }

        $parts = collect(explode(',', (string) $request->header('x-signature')))
            ->mapWithKeys(function ($part) {
                [$key, $value] = array_pad(explode('=', trim($part), 2), 2, null);

                return [$key => $value];
            });

        $ts = $parts->get('ts');
        $hash = $parts->get('v1');

        if (! $ts || ! $hash) {
            return false;
        }

        $manifest = 'id:'.strtolower($dataId).';';
        if ($requestId = $request->header('x-request-id')) {
            $manifest .= 'request-id:'.$requestId.';';
        }
        $manifest .= 'ts:'.$ts.';';

        return hash_equals(hash_hmac('sha256', $manifest, $secret), $hash);
    }
}
