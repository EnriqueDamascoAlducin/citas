<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\MercadoPagoConfig;

class WebhookController extends Controller
{
    public function mpIpn(Request $request): JsonResponse
    {
        $topic = $request->query('topic');
        $id = $request->query('id');

        if ($topic !== 'payment' || ! $id) {
            return response()->json(['message' => 'ignored'], 200);
        }

        MercadoPagoConfig::setAccessToken(config('services.mercadopago.access_token'));

        $client = new PaymentClient;
        $mpPayment = $client->get((int) $id);

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
}
