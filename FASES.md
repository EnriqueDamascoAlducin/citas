# Plan de Fases — Sistema de Citas (Peluquería/Barbería/Spa)

## Fase 0 — Setup Inicial
- [ ] Instalar `spatie/laravel-permission`
- [ ] Instalar `mercadopago/dx-php` SDK
- [ ] Publicar configuración de Spatie
- [ ] Configurar modelo User con `HasRoles`

## Fase 1 — Base de Datos (Migraciones + Modelos)
- [ ] Migración `services` (nombre, descripción, duración_minutos, precio, activo)
- [ ] Migración `schedules` (user_id, day_of_week, start_time, end_time, activo)
- [ ] Migración `schedule_exceptions` (user_id, date, start_time, end_time, available, reason)
- [ ] Migración `appointments` (user_id, employee_id, service_id, start_time, end_time, status, notes, total_amount)
- [ ] Migración `product_categories` (name, description, activo)
- [ ] Migración `products` (name, description, price, stock, image, category_id, activo)
- [ ] Migración `appointment_product` (appointment_id, product_id, quantity, price)
- [ ] Migración `payments` (appointment_id, mp_payment_id, status, amount, method)
- [ ] Modelos: Service, Schedule, ScheduleException, Appointment, Product, ProductCategory, Payment
- [ ] Relaciones entre modelos

## Fase 2 — Roles y Permisos (Spatie)
- [ ] Seeder: `super-admin`, `admin`, `employee`, `client`
- [ ] Permisos: `view-appointments`, `create-appointments`, `cancel-appointments`
- [ ] Permisos: `manage-services`, `manage-products`, `manage-employees`
- [ ] Permisos: `manage-schedule`, `manage-stock`, `view-any-appointment`
- [ ] Seeder con usuario admin por defecto

## Fase 3 — CRUD Servicios (Admin)
- [ ] Backend: ServiceController + FormRequest + routes
- [ ] Frontend: Lista, crear, editar, activar/desactivar servicios

## Fase 4 — Gestión Horarios Empleados
- [ ] Backend: ScheduleController, ScheduleExceptionController
- [ ] Frontend: Calendario semanal para gestionar disponibilidad
- [ ] Validación: slots no overlapping

## Fase 5 — CRUD Productos (Admin)
- [ ] Backend: ProductController, ProductCategoryController, FormRequests
- [ ] Frontend: Lista, crear, editar productos + categorías
- [ ] Control de stock (alertas cuando quede poco)

## Fase 6 — Booking Público (Multi-step Wizard)
- [ ] Step 1: Seleccionar fecha (calendario)
- [ ] Step 2: Seleccionar servicio
- [ ] Step 3: Seleccionar empleado (disponibilidad en esa fecha)
- [ ] Step 4: Seleccionar horario (slots disponibles x duración servicio)
- [ ] Step 5: Registro/Login (si no autenticado)
- [ ] Step 6: Productos recomendados (upsell)
- [ ] Step 7: Resumen y confirmar

## Fase 7 — Pagos con Mercado Pago
- [ ] Configurar credenciales MP
- [ ] Crear preferencia de pago al confirmar cita
- [ ] Checkout MP (redirect o modal)
- [ ] Webhook para actualizar estado de pago
- [ ] Manejo de pagos exitosos/fallidos/reembolsos

## Fase 8 — Dashboard Empleado
- [ ] Ver citas del día
- [ ] Marcar asistencia / completar cita
- [ ] Cancelar citas (con motivo)
- [ ] Ver historial

## Fase 9 — Dashboard Cliente
- [ ] Ver mis citas (próximas y pasadas)
- [ ] Cancelar citas (con política de cancelación)
- [ ] Reprogramar cita
- [ ] Perfil

## Fase 10 — Dashboard Admin
- [ ] Ver todas las citas (filtros: fecha, empleado, servicio, estado)
- [ ] Gestión de empleados (asignar roles)
- [ ] Reportes básicos (ingresos, citas por servicio, ocupación)
