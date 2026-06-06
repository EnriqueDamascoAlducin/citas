<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'appointment_id',
        'mp_payment_id',
        'status',
        'amount',
        'method',
        'mp_response',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'mp_response' => 'array',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
