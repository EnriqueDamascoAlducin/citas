<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Datos propios de un estudio de tatuajes: anticipo por servicio y, en cada cita,
 * zona del cuerpo, tamaño aproximado, foto de referencia y la confirmación de mayoría de edad.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->decimal('deposit_amount', 10, 2)->default(0)->after('price');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->string('body_zone', 50)->nullable()->after('notes');
            $table->string('tattoo_size', 20)->nullable()->after('body_zone');
            $table->string('reference_image_path')->nullable()->after('tattoo_size');
            $table->decimal('deposit_amount', 10, 2)->default(0)->after('total_amount');
            $table->timestamp('age_confirmed_at')->nullable()->after('deposit_amount');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['body_zone', 'tattoo_size', 'reference_image_path', 'deposit_amount', 'age_confirmed_at']);
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('deposit_amount');
        });
    }
};
