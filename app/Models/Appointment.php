<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use App\Enums\TattooSize;
use App\Observers\AppointmentObserver;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy(AppointmentObserver::class)]
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
        'body_zone',
        'tattoo_size',
        'reference_image_path',
        'total_amount',
        'deposit_amount',
        'age_confirmed_at',
        'reminder_sent_at',
        'reminder_message_sid',
        'reminder_error',
        'client_confirmed_at',
    ];

    /** La ruta interna del archivo no sale al navegador; se usa referenceImageUrl(). */
    protected $hidden = ['reference_image_path'];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'total_amount' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'tattoo_size' => TattooSize::class,
            'age_confirmed_at' => 'datetime',
            'reminder_sent_at' => 'datetime',
            'client_confirmed_at' => 'datetime',
        ];
    }

    /** Pendientes o confirmadas que empiezan en los próximos $minutes y aún sin recordatorio. */
    public function scopeDueForReminder(Builder $query, int $minutes): void
    {
        $query->whereIn('status', [AppointmentStatus::Pending->value, AppointmentStatus::Confirmed->value])
            ->whereNull('reminder_sent_at')
            ->whereBetween('start_time', [now(), now()->addMinutes($minutes)]);
    }

    /** Lo que se cobra en línea: el anticipo si el servicio lo pide, si no el total. */
    public function amountDueOnline(): float
    {
        return (float) $this->deposit_amount > 0
            ? (float) $this->deposit_amount
            : (float) $this->total_amount;
    }

    /** Liga a la foto de referencia (archivo privado, solo personal autorizado o quien agendó). */
    public function referenceImageUrl(): ?string
    {
        return $this->reference_image_path
            ? route('appointments.reference-image', $this)
            : null;
    }

    /** Quien agendó: cliente con cuenta o, si la hizo alguien del personal, ese usuario. */
    public function booker(): Customer|User|null
    {
        return $this->customer ?? $this->client;
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
