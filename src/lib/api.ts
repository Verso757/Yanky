import { db } from "./firebase";
import { 
  collection, getDocs, getDoc, doc, setDoc, addDoc, updateDoc, 
  query, where, orderBy, deleteDoc, serverTimestamp 
} from "firebase/firestore";
import bcrypt from "bcryptjs"; // We can use bcrypt in browser? No, bcryptjs works in browser.

// Mock Axios implementation over Firestore
export const api = {
  defaults: {
    headers: {
      common: {} as Record<string, string>
    }
  },
  get: async (url: string) => {
    return handleRequest("GET", url);
  },
  post: async (url: string, data?: any) => {
    return handleRequest("POST", url, data);
  },
  patch: async (url: string, data?: any) => {
    return handleRequest("PATCH", url, data);
  },
  delete: async (url: string) => {
    return handleRequest("DELETE", url);
  }
};

async function handleRequest(method: string, url: string, data?: any) {
  try {
    const res = await processRoute(method, url, data);
    return { data: res };
  } catch (err: any) {
    console.error("API Error", method, url, err);
    throw { response: { data: { error: err.message || "Error interno" } } };
  }
}

async function processRoute(method: string, url: string, data: any) {
  // --- AUTH ---
  if (method === "POST" && url === "/api/auth/login") {
    const { email, password } = data;
    const usersSnap = await getDocs(query(collection(db, "users"), where("email", "==", email)));
    
    // Seed admin if empty and trying to login with admin@taller.com / 123456
    if (usersSnap.empty && email === "admin@taller.com" && password === "123456") {
      const hash = bcrypt.hashSync(password, 10);
      const newAdmin = {
        nombre: "Admin", email, passwordHash: hash, rol: "ADMIN", activo: true, creadoEn: new Date().toISOString()
      };
      const docRef = doc(collection(db, "users"));
      await setDoc(docRef, newAdmin);
      const user = { id: docRef.id, ...newAdmin };
      return { token: "fake-jwt-token-" + user.id, user };
    }

    if (usersSnap.empty) throw new Error("Credenciales inválidas o usuario inactivo");
    const userDoc = usersSnap.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as any;

    if (!user.activo) throw new Error("Credenciales inválidas o usuario inactivo");
    
    if (!bcrypt.compareSync(password, user.passwordHash)) {
      throw new Error("Credenciales inválidas");
    }
    
    return { token: "fake-jwt-token-" + user.id, user: { id: user.id, nombre: user.nombre, rol: user.rol, email: user.email } };
  }
  if (method === "POST" && url === "/api/auth/logout") {
    return { success: true };
  }

  // --- USUARIOS ---
  if (method === "GET" && url === "/api/usuarios") {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  if (method === "POST" && url === "/api/usuarios") {
    const { nombre, email, password, rol } = data;
    const existSnap = await getDocs(query(collection(db, "users"), where("email", "==", email)));
    if (!existSnap.empty) throw new Error("Email ya registrado");
    const docRef = doc(collection(db, "users"));
    const newUser = { nombre, email, passwordHash: bcrypt.hashSync(password, 10), rol, activo: true, creadoEn: new Date().toISOString() };
    await setDoc(docRef, newUser);
    return { id: docRef.id, ...newUser };
  }
  if (method === "PATCH" && url.startsWith("/api/usuarios/")) {
    const id = url.split("/").pop()!;
    const updates = { ...data };
    if (updates.password) {
      updates.passwordHash = bcrypt.hashSync(updates.password, 10);
      delete updates.password;
    }
    await updateDoc(doc(db, "users", id), updates);
    const d = await getDoc(doc(db, "users", id));
    return { id: d.id, ...d.data() };
  }

  // --- CLIENTES ---
  if (method === "GET" && url === "/api/clientes") {
    const snap = await getDocs(collection(db, "clientes"));
    const clientes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // fetch vehiculos
    const vSnap = await getDocs(collection(db, "vehiculos"));
    const vehiculos = vSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    clientes.forEach((c: any) => {
      c.vehiculos = vehiculos.filter(v => v.clienteId === c.id);
    });
    return clientes;
  }

  // --- VEHICULOS ---
  if (method === "GET" && url === "/api/vehiculos") {
    const snap = await getDocs(collection(db, "vehiculos"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // --- ASEGURADORAS ---
  if (method === "GET" && url === "/api/aseguradoras") {
    const snap = await getDocs(collection(db, "aseguradoras"));
    const as = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return as;
  }

  // --- ORDENES ---
  if (method === "GET" && url === "/api/ordenes") {
    const snap = await getDocs(collection(db, "ordenes"));
    const ordenes = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    // populate
    const clientes = (await getDocs(collection(db, "clientes"))).docs.map(d => ({ id: d.id, ...d.data() }));
    const vehiculos = (await getDocs(collection(db, "vehiculos"))).docs.map(d => ({ id: d.id, ...d.data() }));
    
    ordenes.forEach(o => {
      o.cliente = clientes.find(c => c.id === o.clienteId);
      o.vehiculo = vehiculos.find(v => v.id === o.vehiculoId);
      o.createdAt = o.createdAt || new Date().toISOString();
    });
    return ordenes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  if (method === "POST" && url === "/api/ordenes") {
    const docRef = doc(collection(db, "ordenes"));
    const ot = {
      folio: `OT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      origen: data.origen,
      clienteId: data.clienteId,
      vehiculoId: data.vehiculoId,
      descripcion: data.descripcion,
      kilometraje: data.kilometraje ? parseInt(data.kilometraje) : null,
      montoCotizado: data.montoCotizado ? parseFloat(data.montoCotizado) : 0,
      montoCobrado: 0,
      quienPaga: data.quienPaga || 'CLIENTE',
      estado: data.estado || 'INGRESADO',
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, ot);
    return { id: docRef.id, ...ot };
  }

  if (method === "PATCH" && url.match(/\/api\/ordenes\/([^/]+)\/estado/)) {
    const id = url.match(/\/api\/ordenes\/([^/]+)\/estado/)![1];
    await updateDoc(doc(db, "ordenes", id), { estado: data.estado });
    
    if (data.estado === 'ENTREGADO') {
      const gSnap = await getDocs(query(collection(db, "garantias"), where("ordenTrabajoId", "==", id)));
      if (gSnap.empty) {
        const d = new Date();
        d.setDate(d.getDate() + 90);
        await addDoc(collection(db, "garantias"), {
          tipo: "OTRO",
          vigenciaDias: 90,
          fechaVencimiento: d.toISOString(),
          ordenTrabajoId: id
        });
      }
    }
    const d = await getDoc(doc(db, "ordenes", id));
    return { id: d.id, ...d.data() };
  }

  if (method === "POST" && url.match(/\/api\/ordenes\/([^/]+)\/pago/)) {
    const id = url.match(/\/api\/ordenes\/([^/]+)\/pago/)![1];
    const pago = { ...data, ordenTrabajoId: id, createdAt: new Date().toISOString() };
    await addDoc(collection(db, "pagos"), pago);
    
    const otSnap = await getDoc(doc(db, "ordenes", id));
    if (otSnap.exists()) {
      const current = otSnap.data().montoCobrado || 0;
      await updateDoc(doc(db, "ordenes", id), { montoCobrado: current + parseFloat(data.monto) });
    }
    return pago;
  }

  // --- GARANTIAS ---
  if (method === "GET" && url === "/api/garantias") {
    const snap = await getDocs(collection(db, "garantias"));
    const gar = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    const ots = (await getDocs(collection(db, "ordenes"))).docs.map(d => ({ id: d.id, ...d.data() }));
    const clientes = (await getDocs(collection(db, "clientes"))).docs.map(d => ({ id: d.id, ...d.data() }));
    const vehiculos = (await getDocs(collection(db, "vehiculos"))).docs.map(d => ({ id: d.id, ...d.data() }));
    
    gar.forEach(g => {
      const ot: any = ots.find(o => o.id === g.ordenTrabajoId);
      if (ot) {
        ot.cliente = clientes.find(c => c.id === ot.clienteId);
        ot.vehiculo = vehiculos.find(v => v.id === ot.vehiculoId);
      }
      g.ordenTrabajo = ot;
    });
    return gar;
  }

  // --- GASTOS ---
  if (method === "GET" && url === "/api/gastos") {
    const snap = await getDocs(collection(db, "gastos"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a:any, b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (method === "POST" && url === "/api/gastos") {
    const g = {
      ...data,
      monto: parseFloat(data.monto),
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "gastos"), g);
    return { id: docRef.id, ...g };
  }

  // --- PRESUPUESTOS ---
  if (method === "GET" && url === "/api/presupuestos") {
    const snap = await getDocs(collection(db, "presupuestos"));
    const p = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    const clientes = (await getDocs(collection(db, "clientes"))).docs.map(d => ({ id: d.id, ...d.data() }));
    const vehiculos = (await getDocs(collection(db, "vehiculos"))).docs.map(d => ({ id: d.id, ...d.data() }));
    
    p.forEach(x => {
      x.cliente = clientes.find(c => c.id === x.clienteId);
      x.vehiculo = vehiculos.find(v => v.id === x.vehiculoId);
      x.createdAt = x.createdAt || new Date().toISOString();
    });
    return p.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (method === "POST" && url === "/api/presupuestos") {
    const p = {
      folio: `PRE-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`,
      placas: data.placas,
      descripcionDano: data.descripcionDano,
      montoEstimado: data.montoEstimado ? parseFloat(data.montoEstimado) : 0,
      clienteNombre: data.clienteNombre || null,
      clienteTelefono: data.clienteTelefono || null,
      clienteId: data.clienteId || null,
      vehiculoId: data.vehiculoId || null,
      estado: "PENDIENTE",
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "presupuestos"), p);
    return { id: docRef.id, ...p };
  }

  if (method === "POST" && url.match(/\/api\/presupuestos\/([^/]+)\/aprobar/)) {
    const id = url.match(/\/api\/presupuestos\/([^/]+)\/aprobar/)![1];
    const { clienteInfo, vehiculoInfo } = data || {};
    
    const pSnap = await getDoc(doc(db, "presupuestos", id));
    if (!pSnap.exists()) throw new Error("No encontrado");
    const p = pSnap.data();
    
    let clienteId = p.clienteId;
    let vehiculoId = p.vehiculoId;

    if (!clienteId) {
      const cRef = await addDoc(collection(db, "clientes"), {
        nombre: clienteInfo?.nombre || p.clienteNombre || "Cliente General",
        telefono: clienteInfo?.telefono || p.clienteTelefono,
        email: clienteInfo?.email || null,
      });
      clienteId = cRef.id;
    }

    if (!vehiculoId) {
      const vRef = await addDoc(collection(db, "vehiculos"), {
        placas: p.placas,
        marca: vehiculoInfo?.marca || "Desconocida",
        modelo: vehiculoInfo?.modelo || "Desconocido",
        anio: vehiculoInfo?.anio ? parseInt(vehiculoInfo.anio) : new Date().getFullYear(),
        color: vehiculoInfo?.color || "Desconocido",
        clienteId: clienteId
      });
      vehiculoId = vRef.id;
    }

    const ot = {
      folio: `OT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      origen: "PRESUPUESTO",
      presupuestoId: id,
      clienteId,
      vehiculoId,
      descripcion: p.descripcionDano,
      montoCotizado: p.montoEstimado,
      estado: "INGRESADO",
      createdAt: new Date().toISOString()
    };
    const otRef = await addDoc(collection(db, "ordenes"), ot);
    
    await updateDoc(doc(db, "presupuestos", id), { estado: "APROBADO", clienteId, vehiculoId });
    return { ot: { id: otRef.id, ...ot }, presupuesto: { id, ...p, estado: "APROBADO" } };
  }

  if (method === "PATCH" && url.match(/\/api\/presupuestos\/([^/]+)\/rechazar/)) {
    const id = url.match(/\/api\/presupuestos\/([^/]+)\/rechazar/)![1];
    await updateDoc(doc(db, "presupuestos", id), { estado: "RECHAZADO" });
    return { success: true };
  }

  // --- EVIDENCIAS ---
  if (method === "GET" && url.startsWith("/api/evidencias/presupuesto/")) {
    const id = url.split("/").pop();
    const snap = await getDocs(query(collection(db, "evidencias"), where("presupuestoId", "==", id)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  if (method === "GET" && url.startsWith("/api/evidencias/orden/")) {
    const id = url.split("/").pop();
    const snap = await getDocs(query(collection(db, "evidencias"), where("ordenTrabajoId", "==", id)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  if (method === "POST" && url === "/api/evidencias") {
    // data is FormData
    const file = data.get("file");
    const descripcion = data.get("descripcion");
    const presupuestoId = data.get("presupuestoId");
    const ordenTrabajoId = data.get("ordenTrabajoId");
    
    // We mock file upload by reading it as base64
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    const ev = {
      urlBase64: base64,
      descripcion: descripcion || file.name,
      presupuestoId: presupuestoId || null,
      ordenTrabajoId: ordenTrabajoId || null,
      createdAt: new Date().toISOString()
    };
    const ref = await addDoc(collection(db, "evidencias"), ev);
    return { id: ref.id, ...ev };
  }

  throw new Error("Route not mocked: " + method + " " + url);
}

export default api;
