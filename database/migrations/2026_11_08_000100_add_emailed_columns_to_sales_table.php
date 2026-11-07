<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Último envío del ticket por correo, para que el ticket diga a quién y cuándo se mandó.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('emailed_to')->nullable()->after('cancel_reason');
            $table->timestamp('emailed_at')->nullable()->after('emailed_to');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['emailed_to', 'emailed_at']);
        });
    }
};
