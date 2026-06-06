<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $capilar = ProductCategory::where('name', 'Cuidado Capilar')->first();
        $barba = ProductCategory::where('name', 'Barba y Bigote')->first();
        $facial = ProductCategory::where('name', 'Cuidado Facial')->first();
        $corporal = ProductCategory::where('name', 'Cuidado Corporal')->first();
        $accesorios = ProductCategory::where('name', 'Accesorios')->first();

        $products = [
            ['name' => 'Shampoo Profesional 300ml', 'description' => 'Shampoo neutro con biotina para uso diario.', 'price' => 180, 'stock' => 20, 'category_id' => $capilar->id],
            ['name' => 'Acondicionador Profesional 300ml', 'description' => 'Acondicionador hidratante con keratina.', 'price' => 180, 'stock' => 15, 'category_id' => $capilar->id],
            ['name' => 'Pomada para Cabello Fuerte', 'description' => 'Pomada con fijación extra para peinados clásicos.', 'price' => 220, 'stock' => 12, 'category_id' => $capilar->id],
            ['name' => 'Cera Modeladora', 'description' => 'Cera con fijación media y acabado mate.', 'price' => 190, 'stock' => 10, 'category_id' => $capilar->id],
            ['name' => 'Spray Fijador', 'description' => 'Spray de fijación fuerte con protección UV.', 'price' => 160, 'stock' => 8, 'category_id' => $capilar->id],
            ['name' => 'Aceite para Barba 30ml', 'description' => 'Aceite hidratante con aroma a sándalo.', 'price' => 150, 'stock' => 25, 'category_id' => $barba->id],
            ['name' => 'Bálsamo para Barba 50g', 'description' => 'Bálsamo acondicionador con manteca de karité.', 'price' => 170, 'stock' => 18, 'category_id' => $barba->id],
            ['name' => 'Shampoo para Barba 200ml', 'description' => 'Shampoo suave especialmente formulado para barba.', 'price' => 140, 'stock' => 14, 'category_id' => $barba->id],
            ['name' => 'Cera para Bigote', 'description' => 'Cera con fijación firme para modelar bigote.', 'price' => 130, 'stock' => 3, 'category_id' => $barba->id],
            ['name' => 'Peine para Barba', 'description' => 'Peine de madera con cerdas mixtas.', 'price' => 90, 'stock' => 30, 'category_id' => $barba->id],
            ['name' => 'Crema Hidratante Facial', 'description' => 'Crema ligera con ácido hialurónico.', 'price' => 200, 'stock' => 12, 'category_id' => $facial->id],
            ['name' => 'Protector Solar SPF50', 'description' => 'Protector solar facial no graso.', 'price' => 250, 'stock' => 10, 'category_id' => $facial->id],
            ['name' => 'Exfoliante Facial', 'description' => 'Exfoliante suave con partículas de jojoba.', 'price' => 160, 'stock' => 7, 'category_id' => $facial->id],
            ['name' => 'Jabón Artesanal de Carbón', 'description' => 'Jabón desintoxicante con carbón activado.', 'price' => 80, 'stock' => 20, 'category_id' => $corporal->id],
            ['name' => 'Desodorante Natural', 'description' => 'Desodorante sin alcohol ni aluminio.', 'price' => 110, 'stock' => 6, 'category_id' => $corporal->id],
            ['name' => 'Navaja de Barbería', 'description' => 'Navaja clásica con hoja de acero inoxidable.', 'price' => 350, 'stock' => 5, 'category_id' => $accesorios->id],
            ['name' => 'Cepillo para Cabello', 'description' => 'Cepillo de cerdas naturales con base de madera.', 'price' => 120, 'stock' => 15, 'category_id' => $accesorios->id],
            ['name' => 'Peine de Bolsillo', 'description' => 'Peine plegable de acero inoxidable.', 'price' => 60, 'stock' => 4, 'category_id' => $accesorios->id],
            ['name' => 'Toalla de Barbero', 'description' => 'Toalla de algodón 100% de alta absorción.', 'price' => 100, 'stock' => 25, 'category_id' => $accesorios->id],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(
                ['name' => $product['name']],
                $product
            );
        }
    }
}
