<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Exceptions\MPApiException;
use MercadoPago\MercadoPagoConfig;

class PaymentController extends Controller
{
    public function createPreference(Request $request): JsonResponse
    {
        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
        ]);

        $appointment = Appointment::with(['service', 'products'])->findOrFail($request->appointment_id);

        if (Auth::guard('customer')->check()) {
            abort_if($appointment->customer_id !== Auth::guard('customer')->id(), 403);
        } else {
            abort_if($appointment->user_id !== $request->user()->id, 403);
        }

        MercadoPagoConfig::setAccessToken(config('services.mercadopago.access_token'));

        $items = [
            [
                'title' => $appointment->service->name,
                'quantity' => 1,
                'unit_price' => (float) $appointment->service->price,
                'currency_id' => 'MXN',
            ],
        ];

        foreach ($appointment->products as $product) {
            $items[] = [
                'title' => $product->name,
                'quantity' => $product->pivot->quantity,
                'unit_price' => (float) $product->pivot->price,
                'currency_id' => 'MXN',
            ];
        }

        try {
            $client = new PreferenceClient;
            $preference = $client->create([
                'items' => $items,
                'external_reference' => (string) $appointment->id,
                'back_urls' => [
                    'success' => route('customer.dashboard'),
                    'failure' => route('customer.dashboard'),
                    'pending' => route('customer.dashboard'),
                ],
                'auto_return' => 'approved',
            ]);
        } catch (MPApiException $e) {
            Log::error('MP API Error', [
                'status' => $e->getStatusCode(),
                'body' => $e->getApiResponse()->getContent(),
                'appointment_id' => $appointment->id,
            ]);

            return response()->json(['error' => 'Error de Mercado Pago: '.$e->getApiResponse()->getContent()], 422);
        }

        $appointment->payments()->create([
            'mp_payment_id' => null,
            'status' => 'pending',
            'amount' => $appointment->total_amount,
            'method' => 'mercadopago',
        ]);

        return response()->json([
            'preference_id' => $preference->id,
            'init_point' => $preference->init_point,
        ]);
    }

    public function processCardPayment(Request $request): JsonResponse
    {
        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'token' => 'required|string',
            'payment_method_id' => 'required|string',
            'installments' => 'required|integer|min:1',
            'email' => 'required|email',
        ]);

        $appointment = Appointment::with(['service', 'products'])->findOrFail($request->appointment_id);

        if (Auth::guard('customer')->check()) {
            abort_if($appointment->customer_id !== Auth::guard('customer')->id(), 403);
        } else {
            abort_if($appointment->user_id !== $request->user()->id, 403);
        }

        MercadoPagoConfig::setAccessToken(config('services.mercadopago.access_token'));

        try {
            $client = new PaymentClient;
            $payment = $client->create([
                'transaction_amount' => (float) $appointment->total_amount,
                'token' => $request->token,
                'description' => $appointment->service->name,
                'installments' => (int) $request->installments,
                'payment_method_id' => $request->payment_method_id,
                'payer' => [
                    'email' => $request->email,
                    'identification' => [
                        'type' => $request->identification_type ?? 'other',
                        'number' => $request->identification_number ?? '',
                    ],
                ],
                'external_reference' => (string) $appointment->id,
            ]);

            $status = match ($payment->status) {
                'approved' => 'paid',
                'pending', 'in_process' => 'pending',
                'rejected', 'cancelled', 'refunded', 'charged_back' => 'failed',
                default => 'pending',
            };

            $appointment->payments()->create([
                'mp_payment_id' => $payment->id,
                'status' => $status,
                'amount' => $appointment->total_amount,
                'method' => 'mercadopago',
            ]);

            if ($status === 'paid') {
                $appointment->update(['status' => 'confirmed']);
            }

            return response()->json([
                'success' => true,
                'status' => $status,
                'payment_id' => $payment->id,
            ]);
        } catch (MPApiException $e) {
            Log::error('MP Card Payment Error', [
                'status' => $e->getStatusCode(),
                'body' => $e->getApiResponse()->getContent(),
                'appointment_id' => $appointment->id,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error al procesar el pago: '.$e->getApiResponse()->getContent(),
            ], 422);
        }
    }
}
