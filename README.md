# FixFlow Taller

FixFlow Taller es una aplicación web full-stack diseñada para gestionar las operaciones diarias de un taller automotriz, incluyendo la recepción de vehículos, seguimiento de órdenes de trabajo, y presupuestos.

## Novedades Recientes
- **Tablero Kanban Interactivo (Drag & Drop UI)**: Se incorporó una vista de Tablero visual para gestionar los estados de las órdenes de trabajo. Los elementos cambian de estado con botones de acción directa desde el tablero.
- **Check-In Integral de Reparación**: Durante la creación de una Orden de Trabajo, ahora se documenta el estado inicial del vehículo, incluyendo Nivel de Gasolina, Inventario a bordo y Daños Exteriores Previos. Esta información se imprime en el protocolo de entrega final para evitar malentendidos.
- **Flujo Simplificado**:
  - Se enfatiza el check-in riguroso y seguimiento de aprobaciones.
  - Se pospuso temporalmente el registro granular de refacciones/compras y el control de pagos parciales para mantener una interfaz ligera y enfocada en la visibilidad del proceso.

## Módulos Activos
1. **Órdenes de Trabajo**: Lista y Tablero de Kanban, con detalle completo de check-in.
2. **Presupuestos (Recepción Express)**: Valoración rápida, aprobación y conversión directa a Órdenes de Trabajo.
3. **Seguimiento Visual**: Panel táctico para ver en qué fase está cada vehículo (Ingresado, Diagnóstico, En Proceso, Listo).
4. **Clientes y Vehículos**: Autoguardado de base de datos de usuarios.

## Puesta en marcha
`npm install`
`npm run dev`
