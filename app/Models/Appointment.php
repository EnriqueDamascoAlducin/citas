<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Appointment extends Model
{
    protected $fillable = [
        'user_id',
        'customer_id',
        'employee_id',
        'service_id',
        'start_time',
        'end_time',
        'status',
        'notes',
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'total_amount' => 'decimal:2',
        ];
    }

    public function scopeForEmployee(Builder $query, User|int $employee): void
    {
        $query->where('employee_id', $employee instanceof User ? $employee->id : $employee);
    }

    /** Citas que siguen ocupando la agenda (excluye canceladas y no asistió). */
    public function scopeActive(Builder $query): void
    {
        $query->whereNotIn('status', [AppointmentStatus::Cancelled->value, AppointmentStatus::NoShow->value]);
    }

    public function scopeBetweenDates(Builder $query, CarbonInterface $from, CarbonInterface $to): void
    {
        $query->whereBetween('start_time', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'appointment_product')
            ->withPivot('quantity', 'price')
            ->withTimestamps();
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
