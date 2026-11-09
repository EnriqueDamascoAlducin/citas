<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['name' => 'Valoración y Diseño', 'description' => 'Platica tu idea con el tatuador, revisamos zona, tamaño y presupuesto. Sin costo.', 'duration_minutes' => 30, 'price' => 0, 'deposit_amount' => 0],
            ['name' => 'Tatuaje Pequeño', 'description' => 'Diseños de hasta 5 cm: líneas finas, letras, símbolos o minimalista.', 'duration_minutes' => 60, 'price' => 800, 'deposit_amount' => 300],
            ['name' => 'Tatuaje Mediano', 'description' => 'Diseños de 5 a 15 cm con sombra o color.', 'duration_minutes' => 120, 'price' => 1800, 'deposit_amount' => 500],
            ['name' => 'Tatuaje Grande', 'description' => 'Diseños de 15 a 30 cm. Puede requerir más de una sesión.', 'duration_minutes' => 240, 'price' => 3500, 'deposit_amount' => 1000],
            ['name' => 'Sesión Completa', 'description' => 'Sesión de día completo para mangas, espalda o piezas grandes.', 'duration_minutes' => 360, 'price' => 6000, 'deposit_amount' => 1500],
            ['name' => 'Cover-up', 'description' => 'Cubrimos un tatuaje anterior con un diseño nuevo.', 'duration_minutes' => 180, 'price' => 2800, 'deposit_amount' => 800],
            ['name' => 'Retoque', 'description' => 'Retoque de tatuaje hecho en el estudio (gratis los primeros 3 meses).', 'duration_minutes' => 45, 'price' => 300, 'deposit_amount' => 0],
            ['name' => 'Perforación', 'description' => 'Perforación con material quirúrgico y joyería de titanio incluida.', 'duration_minutes' => 30, 'price' => 450, 'deposit_amount' => 0],
        ];

        foreach ($services as $service) {
            Service::firstOrCreate(
                ['name' => $service['name']],
                $service
            );
        }
    }
}
