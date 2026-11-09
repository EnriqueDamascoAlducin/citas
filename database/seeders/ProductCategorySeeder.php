<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use Illuminate\Database\Seeder;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Cuidado del Tatuaje', 'description' => 'Cremas, bálsamos y jabones para la cicatrización.'],
            ['name' => 'Protección', 'description' => 'Película protectora y bloqueador para tatuajes.'],
            ['name' => 'Joyería', 'description' => 'Joyería de titanio y acero quirúrgico para perforaciones.'],
            ['name' => 'Merch', 'description' => 'Playeras, gorras y accesorios del estudio.'],
            ['name' => 'Tarjetas de Regalo', 'description' => 'Certificados para regalar una sesión.'],
        ];

        foreach ($categories as $category) {
            ProductCategory::firstOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
