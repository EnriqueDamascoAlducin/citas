<?php

namespace App\Http\Controllers;

use Illuminate\Pagination\LengthAwarePaginator;

abstract class Controller
{
    protected static function paginateResponse(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
