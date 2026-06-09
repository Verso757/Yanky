# FixFlow Taller - Arquitectura y Estado del Proyecto

## Descripción General
FixFlow Taller es una aplicación web full-stack diseñada para gestionar las operaciones diarias de un taller de carrocería automotriz. Permite llevar el control de órdenes de trabajo (OTs), seguimiento de vehículos, gestión de clientes (particulares y flotillas), aseguradoras, cobros y garantías. 

El modelo de negocio soporta tanto clientes directos como reparaciones canalizadas a través de aseguradoras (flujo directo de reparación o flujo de solo cotización).

## Arquitectura Técnica
La aplicación está construida utilizando una arquitectura cliente-servidor en un monorepositorio, enfocada en la velocidad de desarrollo y facilidad de despliegue.

- **Frontend**: React 18 con TypeScript, empaquetado con Vite.
- **Estilos y UI**: Tailwind CSS junto con componentes accesibles de shadcn/ui (Radix UI) y lucide-react para los iconos.
- **Enrutamiento del cliente**: `react-router-dom` para una experiencia SPA (Single Page Application) rápida e interactiva.
- **Backend / API**: Express.js corriendo sobre Node.js (TypeScript). Provee endpoints REST JSON integrados en el mismo puerto que el cliente.
- **Base de Datos y ORM**: Prisma ORM utilizando SQLite para la base de datos de desarrollo (`dev.db`). El esquema está preparado para migrar fácilmente a PostgreSQL o MySQL en producción.

## Módulos Construidos Hasta Ahora (Integrados y Funcionales)

1. **Dashboard (Panel de Control)**
   - Métricas en tiempo real: OTs activas, vehículos en el taller, ingresos mensuales, saldo pendiente por cobrar a directos y a aseguradoras.
   - Alertas críticas (próximas entregas, garantías por expirar).

2. **Órdenes de Trabajo (OTs)**
   - Creación de OTs (flujo de ingreso).
   - Listado con filtros (búsqueda por cliente, folio o placas) y estados codificados por color (Ingresado, En Diagnóstico, En Proceso, Listo, Entregado).
   - Vista de detalle: Información cruzada (Cliente, Vehículo, Costos).
   - Acciones de OT: Botón de actualización de estado y enlace dinámico de WhatsApp para contactar al cliente.
   - Actualización del estado de la OT que autogenera o resuelve lógicas adjuntas.

3. **Módulo de Finanzas y Pagos**
   - Registro de abonos/pagos directamente en la OT. El pago se descuenta del saldo visualizado en el detalle.
   - Pantalla global de finanzas mostrando: Ingresos Totales vs Gastos Registrados.
   - Formulario para registrar gastos de operación (refacciones, renta, nómina, etc).

4. **Directorio de Clientes y Vehículos**
   - Panel de clientes listando su información de contacto junto con sus vehículos atados a su registro. Incluye placas, marca y modelo. Búsqueda rápida implementada.

5. **Aseguradoras**
   - Directorio de aseguradoras mostrando las OTs vinculadas a cada seguro y el saldo acumulado pendiente de pago por cobros institucionales.

6. **Garantías**
   - Al marcar una OT como "ENTREGADO", el backend automáticamente emite una Garantía de 90 días.
   - Un tablero muestra todas las garantías activas, vencidas o en periodo crítico de vencimiento (< 30 días).

7. **Presupuestos (Recepción Express)**
   - Modelo para capturar en recepción la información base del cliente (Solo Placas, Descripción de daño).
   - Generación de cotización estimada sin pedir detalles formales engorrosos por adelantado.
   - Si se aprueba, genera a través de los datos ingresados las entidades *Cliente*, *Vehículo* y lo convierte directamente a una *OrdenTrabajo*.
   - Si se rechaza, es conservado para estadísticas.

## Modelo de Datos (Esquema Resumido)

La base de datos relacional se estructura en las siguientes entidades principales (definidas en `prisma/schema.prisma`):

- **User**: Usuarios del sistema (roles: ADMIN, RECEPTIONIST, TECHNICIAN).
- **Cliente**: Datos de dueños de vehículos.
- **Vehiculo**: Atados 1 a N a un Cliente.
- **Presupuesto**: Entidad independiente y de fácil inserción. Si se acepta se deriva la creación condicional de Cliente/Vehículo y se atachará a la OT respectiva.
- **Aseguradora**: Datos institucionales de la aseguradora.
- **OrdenTrabajo (OT)**: Entidad central. Junta al Vehiculo, Cliente, Técnico y (opcionalmente) a una Aseguradora. Mantiene saldos, cotizaciones, y estados.
- **Siniestro**: Datos específicos del ajustador y número de reporte (ligado 1 a 1 a una OT de seguro).
- **Pago**: Abonos aplicados a una OT.
- **Gasto**: Salidas de dinero operativas del taller.
- **CambioEstado**: Historial de auditoría para saber cuándo y quién movió una OT de "En Proceso" a "Entregado", etc.
- **Garantia**: Periodos de cobertura tras una entrega.

## Lo que se pretende lograr (Roadmap Próximas Fases)

La aplicación, al proveerse a otra IA para seguir desarrollando, debería abarcar luego:

1. **Autenticación (Auth)**: Implementar un sistema de login real (ej. JWT o sesión de Express) diferenciando las vistas según el rol (Administrador vs Técnico).
2. **Gestor de Evidencias (Fotos)**: Posibilidad de subir fotografías físicas del auto al ingreso y a la entrega, usando un bucket como AWS S3 o Cloudinary.
3. **Módulo de Materiales/Refacciones**: Registro granular de cada tuerca o parte comprada para la OT en específico, logrando extraer la *rentabilidad exacta* (Utilidad = Cobro - (Materiales + Mano de obra)).
4. **Exportación a PDF**: Generar formato PDF del recibo de ingreso o del detalle de diagnóstico para entregar físicamente al cliente.
5. **Dashboard de Productividad del Técnico**: Estadísticas de qué mecánicos/hojalateros entregan más rápido y cuántos coches procesan.
