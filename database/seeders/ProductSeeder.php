<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $cuidado = ProductCategory::where('name', 'Cuidado del Tatuaje')->first();
        $proteccion = ProductCategory::where('name', 'Protección')->first();
        $joyeria = ProductCategory::where('name', 'Joyería')->first();
        $merch = ProductCategory::where('name', 'Merch')->first();
        $regalo = ProductCategory::where('name', 'Tarjetas de Regalo')->first();

        $products = [
            ['name' => 'Crema Cicatrizante 50ml', 'description' => 'Crema con pantenol para las primeras semanas del tatuaje.', 'price' => 220, 'stock' => 25, 'category_id' => $cuidado->id],
            ['name' => 'Bálsamo para Tatuaje 30g', 'description' => 'Bálsamo vegano que aviva el color del tatuaje.', 'price' => 180, 'stock' => 18, 'category_id' => $cuidado->id],
            ['name' => 'Jabón Neutro Antibacterial', 'description' => 'Jabón sin aroma para lavar el tatuaje recién hecho.', 'price' => 90, 'stock' => 30, 'category_id' => $cuidado->id],
            ['name' => 'Espuma Limpiadora', 'description' => 'Espuma suave para limpiar sin tallar.', 'price' => 160, 'stock' => 4, 'category_id' => $cuidado->id],
            ['name' => 'Película Protectora (rollo)', 'description' => 'Película transpirable de segunda piel, 10 cm x 2 m.', 'price' => 250, 'stock' => 12, 'category_id' => $proteccion->id],
            ['name' => 'Bloqueador para Tatuajes SPF50', 'description' => 'Protector en barra que evita que el tatuaje se desvanezca.', 'price' => 200, 'stock' => 10, 'category_id' => $proteccion->id],
            ['name' => 'Arete de Titanio', 'description' => 'Arete de titanio grado implante para perforación nueva.', 'price' => 250, 'stock' => 20, 'category_id' => $joyeria->id],
            ['name' => 'Septum de Acero Quirúrgico', 'description' => 'Herradura para septum, acero 316L.', 'price' => 180, 'stock' => 3, 'category_id' => $joyeria->id],
            ['name' => 'Playera del Estudio', 'description' => 'Playera negra de algodón con el logo del estudio.', 'price' => 350, 'stock' => 15, 'category_id' => $merch->id],
            ['name' => 'Gorra del Estudio', 'description' => 'Gorra snapback bordada.', 'price' => 300, 'stock' => 8, 'category_id' => $merch->id],
            ['name' => 'Tarjeta de Regalo $1,000', 'description' => 'Certificado válido por 6 meses para cualquier servicio.', 'price' => 1000, 'stock' => 50, 'category_id' => $regalo->id],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(
                ['name' => $product['name']],
                $product
            );
        }
    }
}
