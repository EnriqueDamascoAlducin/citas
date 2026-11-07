<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Sale;
use App\Models\User;

/**
 * Quien vende ve sus propias ventas; con el permiso de reportes ve las de todos.
 */
class SalePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::UsePos->value) || $user->can(Permission::ViewSalesReports->value);
    }

    public function view(User $user, Sale $sale): bool
    {
        return $user->can(Permission::ViewSalesReports->value)
            || ($user->can(Permission::UsePos->value) && $sale->user_id === $user->id);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::UsePos->value);
    }

    public function cancel(User $user, Sale $sale): bool
    {
        return $user->can(Permission::CancelSales->value) && ! $sale->isCancelled();
    }
}
