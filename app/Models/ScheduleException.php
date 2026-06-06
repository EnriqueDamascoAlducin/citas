<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleException extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'start_time',
        'end_time',
        'available',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'available' => 'boolean',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
