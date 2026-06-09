import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.cambioEstado.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.gasto.deleteMany();
  await prisma.material.deleteMany();
  await prisma.siniestro.deleteMany();
  await prisma.reclamacionGarantia.deleteMany();
  await prisma.garantia.deleteMany();
  await prisma.ordenTrabajo.deleteMany();
  await prisma.vehiculo.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.aseguradora.deleteMany();
  await prisma.user.deleteMany();
  await prisma.configuracion.deleteMany();
  await prisma.plantillaMensaje.deleteMany();

  // Config y Plantillas
  await prisma.configuracion.create({
    data: {
      nombre: 'Taller de Carrocería XYZ',
      telefono: '555-123-4567',
      direccion: 'Av. Siempre Viva 123',
    }
  });

  await prisma.plantillaMensaje.createMany({
    data: [
      { triggerEstado: 'INGRESADO', mensaje: 'Hola, confirmamos que hemos recibido tu vehículo. Estaremos enviando actualizaciones pronto.' },
      { triggerEstado: 'LISTO', mensaje: 'Tu vehículo ya está listo para entrega. El saldo pendiente es de $[saldo].' }
    ]
  });

  // Usuarios
  const hash = await bcrypt.hash("123456", 10);
  const admin = await prisma.user.create({
    data: { nombre: 'Admin', email: 'admin@taller.com', passwordHash: hash, rol: 'ADMIN' }
  });
  const tech1 = await prisma.user.create({
    data: { nombre: 'Carlos (Técnico)', email: 'carlos@taller.com', passwordHash: hash, rol: 'TECNICO' }
  });
  const tech2 = await prisma.user.create({
    data: { nombre: 'Juan (Técnico)', email: 'juan@taller.com', passwordHash: hash, rol: 'TECNICO' }
  });

  // Aseguradoras
  const ase1 = await prisma.aseguradora.create({
    data: { nombre: 'Seguros GNP', ejecutivoNombre: 'Ana Lopez', condicionesPago: '30 dias' }
  });
  const ase2 = await prisma.aseguradora.create({
    data: { nombre: 'Quálitas', ejecutivoNombre: 'Roberto Martinez', condicionesPago: '15 dias' }
  });

  // Clientes y Vehículos
  const cli1 = await prisma.cliente.create({
    data: {
      nombre: 'Mario Perez', telefono: '5550001111', tipo: 'PARTICULAR',
      vehiculos: { create: [{ marca: 'Nissan', modelo: 'Versa', anio: 2020, color: 'Blanco', placas: 'NVS-123' }] }
    }, include: { vehiculos: true }
  });
  
  const cli2 = await prisma.cliente.create({
    data: {
      nombre: 'Laura Gomez', telefono: '5552223333', tipo: 'PARTICULAR',
      vehiculos: { create: [{ marca: 'Honda', modelo: 'Civic', anio: 2022, color: 'Plata', placas: 'HCV-456' }] }
    }, include: { vehiculos: true }
  });

  // Ordenes de Trabajo
  await prisma.ordenTrabajo.create({
    data: {
      folio: 'OT-2025-0001',
      origen: 'DIRECTO',
      clienteId: cli1.id,
      vehiculoId: cli1.vehiculos[0].id,
      tecnicoId: tech1.id,
      montoCotizado: 5000,
      montoCobrado: 2000,
      quienPaga: 'CLIENTE',
      estado: 'EN_PROCESO',
      descripcion: 'Pintura de fascia delantera',
      kilometraje: 45000
    }
  });

  await prisma.ordenTrabajo.create({
    data: {
      folio: 'OT-2025-0002',
      origen: 'SEGURO_FLUJO_A',
      clienteId: cli2.id,
      vehiculoId: cli2.vehiculos[0].id,
      tecnicoId: tech2.id,
      aseguradoraId: ase1.id,
      montoCotizado: 12000,
      montoCobrado: 0,
      quienPaga: 'ASEGURADORA',
      estado: 'EN_DIAGNOSTICO',
      descripcion: 'Golpe lateral derecho trasero',
      kilometraje: 15000,
      siniestro: {
        create: {
          numero: 'SIN-GNP-999',
          aseguradoraId: ase1.id,
          ajustador: 'Pedro Ruiz'
        }
      }
    }
  });

  console.log('Seed exitoso');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
