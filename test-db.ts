import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const p = await prisma.presupuesto.create({
      data: {
        folio: `PRE-TEST-${Date.now()}`,
        placas: '123',
        descripcionDano: 'test',
        montoEstimado: 0
      }
    });
    console.log("Success:", p);
  } catch (e) {
    console.error("Error creating:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
