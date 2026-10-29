<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Necesita el cron del scheduler (`php artisan schedule:run` cada minuto) en el servidor.
Schedule::command('citas:whatsapp-recordatorios')
    ->everyMinute()
    ->withoutOverlapping();
