<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use Illuminate\Database\Seeder;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Cuidado Capilar', 'description' => 'Shampoos, acondicionadores y tratamientos para el cabello.'],
            ['name' => 'Barba y Bigote', 'description' => 'Aceites, bálsamos y ceras para barba.'],
            ['name' => 'Cuidado Facial', 'description' => 'Cremas, serums y protectores solares.'],
            ['name' => 'Cuidado Corporal', 'description' => 'Jabones, exfoliantes y desodorantes.'],
            ['name' => 'Accesorios', 'description' => 'Peines, cepillos, navajas y accesorios de barbería.'],
        ];

        foreach ($categories as $category) {
            ProductCategory::firstOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
