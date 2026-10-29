<?php

return [

    'mercadopago' => [
        'access_token' => env('MERCADO_PAGO_ACCESS_TOKEN'),
        'public_key' => env('MERCADO_PAGO_PUBLIC_KEY'),
        'webhook_secret' => env('MERCADO_PAGO_WEBHOOK_SECRET'),
    ],

    // Recordatorios de cita por WhatsApp (misma cuenta y forma de configurar que en SAV y FEGAT).
    'twilio' => [
        'sid' => env('TWILIO_ACCOUNT_SID'),
        'token' => env('TWILIO_AUTH_TOKEN'),
        'whatsapp_from' => env('TWILIO_WHATSAPP_FROM'),
        'ssl_verify' => env('TWILIO_SSL_VERIFY', true),
        // Plantilla aprobada (Content SID «HX…») con el botón «Confirmar».
        'template_appointment_reminder' => env('TWILIO_TEMPLATE_APPOINTMENT_REMINDER'),
        // Minutos antes de la cita en que sale el recordatorio (60 o 30, por ejemplo).
        'reminder_minutes' => env('TWILIO_REMINDER_MINUTES', 60),
        // URL pública exacta configurada en Twilio, si el servidor está detrás de un proxy.
        'webhook_url' => env('TWILIO_WEBHOOK_URL'),
    ],

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
