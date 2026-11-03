<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Customer;
use App\Models\User;

/**
 * Lo que el personal puede hacer con las cuentas de clientes.
 */
class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::ManageCustomers->value);
    }

    public function update(User $user, Customer $customer): bool
    {
        return $user->can(Permission::EditCustomers->value);
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $user->can(Permission::EditCustomers->value);
    }
}
