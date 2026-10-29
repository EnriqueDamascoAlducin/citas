<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Recordatorio por WhatsApp antes de la cita y la confirmación del cliente con
 * el botón «Confirmar».
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Se marca antes de enviar: si dos procesos coinciden, solo uno manda.
            $table->timestamp('reminder_sent_at')->nullable()->after('total_amount');
            // SID de Twilio; la respuesta del botón lo trae y así se sabe qué cita confirma.
            $table->string('reminder_message_sid', 64)->nullable()->unique()->after('reminder_sent_at');
            $table->string('reminder_error')->nullable()->after('reminder_message_sid');
            $table->timestamp('client_confirmed_at')->nullable()->after('reminder_error');

            $table->index(['status', 'start_time', 'reminder_sent_at']);
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['status', 'start_time', 'reminder_sent_at']);
            $table->dropUnique(['reminder_message_sid']);
            $table->dropColumn(['reminder_sent_at', 'reminder_message_sid', 'reminder_error', 'client_confirmed_at']);
        });
    }
};
