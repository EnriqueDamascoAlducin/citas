<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->string('mp_payment_id')->nullable(); // Mercado Pago payment ID
            $table->string('status')->default('pending'); // pending, approved, rejected, refunded
            $table->decimal('amount', 10, 2);
            $table->string('method')->nullable(); // credit_card, debit, pix, etc.
            $table->json('mp_response')->nullable(); // raw MP response
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
