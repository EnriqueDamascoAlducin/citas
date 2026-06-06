<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['name' => 'Corte de Cabello', 'description' => 'Corte clásico o moderno con tijera y máquina, incluye lavado y peinado.', 'duration_minutes' => 30, 'price' => 150],
            ['name' => 'Corte + Barba', 'description' => 'Corte de cabello completo más arreglo de barba con toalla caliente y navaja.', 'duration_minutes' => 45, 'price' => 230],
            ['name' => 'Arreglo de Barba', 'description' => 'Perfilado y recorte de barba con toalla caliente y aceites esenciales.', 'duration_minutes' => 20, 'price' => 100],
            ['name' => 'Corte Infantil', 'description' => 'Corte para niños hasta 12 años, ambiente amigable y paciente.', 'duration_minutes' => 25, 'price' => 120],
            ['name' => 'Cejas', 'description' => 'Diseño y perfilado de cejas con pinza y navaja.', 'duration_minutes' => 15, 'price' => 60],
            ['name' => 'Lavado y Peinado', 'description' => 'Lavado con shampoo profesional, acondicionador y peinado con secadora.', 'duration_minutes' => 20, 'price' => 100],
            ['name' => 'Corte Degradado (Fade)', 'description' => 'Corte degradado profesional con difuminado perfecto, incluye lavado.', 'duration_minutes' => 40, 'price' => 200],
            ['name' => 'Tinte de Cabello', 'description' => 'Tinte completo con coloración profesional sin amoniaco.', 'duration_minutes' => 60, 'price' => 400],
        ];

        foreach ($services as $service) {
            Service::firstOrCreate(
                ['name' => $service['name']],
                $service
            );
        }
    }
}
