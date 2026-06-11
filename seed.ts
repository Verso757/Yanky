import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seed() {
  console.log("⏳ Iniciando la carga de datos de demostración...");

  // 1. Verificar si ya hay datos
  const aseguradorasSnap = await getDocs(collection(db, "aseguradoras"));
  if (!aseguradorasSnap.empty) {
    console.log("⚠️ Ya existen datos en la base de datos. Saltando seeding.");
    return;
  }

  // 2. Aseguradoras
  const aseguradoras = [
    { nombre: "GNP Seguros", contacto: "Juan Perez", telefono: "555-1234", email: "juan@gnp.com" },
    { nombre: "Quálitas", contacto: "Maria Gomez", telefono: "555-5678", email: "maria@qualitas.com" },
    { nombre: "AXA Seguros", contacto: "Carlos Lopez", telefono: "555-9012", email: "carlos@axa.com" }
  ];

  for (const a of aseguradoras) {
    await addDoc(collection(db, "aseguradoras"), a);
  }
  console.log("✅ Aseguradoras creadas.");

  // 3. Clientes
  const c1Ref = await addDoc(collection(db, "clientes"), { nombre: "Empresa Transportadora S.A.", email: "flota@transportadora.com", telefono: "5512345678" });
  const c2Ref = await addDoc(collection(db, "clientes"), { nombre: "Luisa Fernandez", email: "luisa@ejemplomail.com", telefono: "5587654321" });
  const c3Ref = await addDoc(collection(db, "clientes"), { nombre: "Roberto Diaz", email: "roberto@ejemplomail.com", telefono: "5599887766" });
  
  console.log("✅ Clientes creados.");

  // 4. Vehículos
  const v1Ref = await addDoc(collection(db, "vehiculos"), { clienteId: c1Ref.id, marca: "Freightliner", modelo: "Cascadia", anio: 2021, placas: "987-ABC", color: "Blanco" });
  const v2Ref = await addDoc(collection(db, "vehiculos"), { clienteId: c2Ref.id, marca: "Volkswagen", modelo: "Jetta", anio: 2018, placas: "XYZ-987", color: "Rojo" });
  const v3Ref = await addDoc(collection(db, "vehiculos"), { clienteId: c3Ref.id, marca: "Toyota", modelo: "Hilux", anio: 2022, placas: "DEF-456", color: "Gris" });
  
  console.log("✅ Vehículos creados.");

  // 5. Presupuestos
  const p1Ref = await addDoc(collection(db, "presupuestos"), {
    folio: `PRE-2026-9042`,
    placas: "DEF-456",
    descripcionDano: "Abolladura en puerta lateral derecha y rayones profundos.",
    montoEstimado: 4500,
    clienteId: c3Ref.id,
    vehiculoId: v3Ref.id,
    estado: "PENDIENTE",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  });

  console.log("✅ Presupuestos creados.");

  // 6. Ordenes de Trabajo
  await addDoc(collection(db, "ordenes"), {
    folio: `OT-2026-1001`,
    origen: "PARTICULAR",
    clienteId: c1Ref.id,
    vehiculoId: v1Ref.id,
    descripcion: "Mantenimiento preventivo completo para camión (Cambio de aceite, filtros y revisión de frenos).",
    kilometraje: 145000,
    montoCotizado: 18500,
    montoCobrado: 18500,
    quienPaga: "CLIENTE",
    estado: "ENTREGADO",
    createdAt: new Date(Date.now() - 400000000).toISOString()
  });

  await addDoc(collection(db, "ordenes"), {
    folio: `OT-2026-1002`,
    origen: "ASEGURADORA",
    clienteId: c2Ref.id,
    vehiculoId: v2Ref.id,
    descripcion: "Reparación de facia delantera por colisión frontal ligera.",
    kilometraje: 32000,
    montoCotizado: 12500,
    montoCobrado: 4000,
    quienPaga: "ASEGURADORA",
    estado: "EN_PROCESO",
    createdAt: new Date().toISOString()
  });

  console.log("✅ Órdenes de Trabajo creadas.");

  // 7. Gastos
  await addDoc(collection(db, "gastos"), {
    descripcion: "Compra de galones de aceite sintético y filtros de alto flujo",
    monto: 3200,
    categoria: "INSUMOS",
    fecha: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  });
  
  await addDoc(collection(db, "gastos"), {
    descripcion: "Pago de luz del taller",
    monto: 1500,
    categoria: "OPERATIVOS",
    fecha: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 50000000).toISOString()
  });

  console.log("✅ Gastos operativos creados.");
  console.log("🎉 ¡Demostración Lista! Los datos se han cargado correctamente.");
}

seed().catch(console.error).then(() => process.exit(0));
