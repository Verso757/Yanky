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
  put: async (url: string, data?: any) => {
    return handleRequest("PUT", url, data);
  },
  delete: async (url: string) => {
    return handleRequest("DELETE", url);
  }
};

const requestCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 15000; // 15 seconds

function colName(name: string) {
  // users collection is shared so login works, everything else is separated
  if (name === "users") return name;
  let userStr = localStorage.getItem("fixflow_user");
  let prefix = "";
  if (userStr) {
    try {
      let user = JSON.parse(userStr);
      if (user.email !== "admin@taller.com") {
        prefix = "real_";
      }
    } catch (e) {}
  }
  return prefix + name;
}

async function handleRequest(method: string, url: string, data?: any) {
  try {
    if (method === "GET") {
      const cached = requestCache.get(url);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return { data: cached.data };
      }
    } else {
      // Clear cache on any mutation
      requestCache.clear();
    }

    const res = await processRoute(method, url, data);
    
    if (method === "GET") {
      requestCache.set(url, { data: res, timestamp: Date.now() });
    }
    
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
    const usersSnap = await getDocs(query(collection(db, colName("users")), where("email", "==", email)));
    
    // Seed admin if empty and trying to login with admin/koferosgroup
    if (usersSnap.empty && ((email === "admin@taller.com" && password === "123456") || (email === "koferosgroup@gmail.com" && password === "123456"))) {
      const hash = bcrypt.hashSync(password, 10);
      const newAdmin = {
        nombre: email === "koferosgroup@gmail.com" ? "Super Admin" : "Admin Presentación", 
        email, 
        passwordHash: hash, 
        rol: "ADMIN", 
        activo: true, 
        creadoEn: new Date().toISOString()
      };
      const docRef = doc(collection(db, colName("users")));
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
    const snap = await getDocs(collection(db, colName("users")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  if (method === "POST" && url === "/api/usuarios") {
    const { nombre, email, password, rol } = data;
    const existSnap = await getDocs(query(collection(db, colName("users")), where("email", "==", email)));
    if (!existSnap.empty) throw new Error("Email ya registrado");
    const docRef = doc(collection(db, colName("users")));
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
    await updateDoc(doc(db, colName("users"), id), updates);
    const d = await getDoc(doc(db, colName("users"), id));
    return { id: d.id, ...d.data() };
  }

  // --- CLIENTES ---
  if (method === "GET" && url === "/api/clientes") {
    const snap = await getDocs(collection(db, colName("clientes")));
    const clientes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // fetch vehiculos
    const vSnap = await getDocs(collection(db, colName("vehiculos")));
    const vehiculos = vSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    clientes.forEach((c: any) => {
      c.vehiculos = vehiculos.filter(v => v.clienteId === c.id);
    });
    return clientes;
  }
  if (method === "POST" && url === "/api/clientes") {
    const ref = await addDoc(collection(db, colName("clientes")), data);
    const d = await getDoc(ref);
    return { id: d.id, ...d.data() };
  }
  if (method === "PUT" && url.match(/\/api\/clientes\/([^/]+)/)) {
    const id = url.match(/\/api\/clientes\/([^/]+)/)![1];
    await updateDoc(doc(db, colName("clientes"), id), data);
    const d = await getDoc(doc(db, colName("clientes"), id));
    return { id: d.id, ...d.data() };
  }

  // --- VEHICULOS ---
  if (method === "GET" && url === "/api/vehiculos") {
    const snap = await getDocs(collection(db, colName("vehiculos")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  if (method === "POST" && url === "/api/vehiculos") {
    const ref = await addDoc(collection(db, colName("vehiculos")), data);
    const d = await getDoc(ref);
    return { id: d.id, ...d.data() };
  }
  if (method === "PUT" && url.match(/\/api\/vehiculos\/([^/]+)/)) {
    const id = url.match(/\/api\/vehiculos\/([^/]+)/)![1];
    await updateDoc(doc(db, colName("vehiculos"), id), data);
    const d = await getDoc(doc(db, colName("vehiculos"), id));
    return { id: d.id, ...d.data() };
  }

  // --- ORDENES POR VEHICULO ---
  if (method === "GET" && url.match(/\/api\/vehiculos\/([^/]+)\/ordenes/)) {
    const id = url.match(/\/api\/vehiculos\/([^/]+)\/ordenes/)![1];
    const q = query(collection(db, colName("ordenes")), where("vehiculoId", "==", id));
    const snap = await getDocs(q);
    const ordenes = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    return ordenes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- ASEGURADORAS ---
  if (method === "GET" && url === "/api/aseguradoras") {
    const snap = await getDocs(collection(db, colName("aseguradoras")));
    const as = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    // populate OTs
    const otsSnap = await getDocs(collection(db, colName("ordenes")));
    const ots = otsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    as.forEach(a => {
      a.ots = ots.filter(o => o.aseguradoraId === a.id);
    });

    return as;
  }
  if (method === "POST" && url === "/api/aseguradoras") {
    const ref = await addDoc(collection(db, colName("aseguradoras")), data);
    return { id: ref.id, ...data };
  }
  if (method === "PUT" && url.match(/\/api\/aseguradoras\/([^/]+)/)) {
    const id = url.match(/\/api\/aseguradoras\/([^/]+)/)![1];
    await updateDoc(doc(db, colName("aseguradoras"), id), data);
    return { id, ...data };
  }

  // --- ORDENES ---
  if (method === "GET" && url === "/api/ordenes") {
    const snap = await getDocs(collection(db, colName("ordenes")));
    const ordenes = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    // populate
    const clientes = (await getDocs(collection(db, colName("clientes")))).docs.map(d => ({ id: d.id, ...d.data() }));
    const vehiculos = (await getDocs(collection(db, colName("vehiculos")))).docs.map(d => ({ id: d.id, ...d.data() }));
    
    ordenes.forEach(o => {
      o.cliente = clientes.find(c => c.id === o.clienteId);
      o.vehiculo = vehiculos.find(v => v.id === o.vehiculoId);
      o.createdAt = o.createdAt || new Date().toISOString();
    });
    return ordenes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  if (method === "POST" && url === "/api/ordenes") {
    const docRef = doc(collection(db, colName("ordenes")));
    const ot = {
      folio: `OT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      origen: data.origen,
      clienteId: data.clienteId,
      vehiculoId: data.vehiculoId,
      descripcion: data.descripcion,
      kilometraje: data.kilometraje ? parseInt(data.kilometraje) : null,
      nivelGasolina: data.nivelGasolina || null,
      inventario: data.inventario || null,
      notasExterior: data.notasExterior || null,
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
    await updateDoc(doc(db, colName("ordenes"), id), { estado: data.estado });
    
    if (data.estado === 'ENTREGADO') {
      const gSnap = await getDocs(query(collection(db, colName("garantias")), where("ordenTrabajoId", "==", id)));
      if (gSnap.empty) {
        const d = new Date();
        d.setDate(d.getDate() + 90);
        await addDoc(collection(db, colName("garantias")), {
          tipo: "OTRO",
          vigenciaDias: 90,
          fechaVencimiento: d.toISOString(),
          ordenTrabajoId: id
        });
      }
    }
    const d = await getDoc(doc(db, colName("ordenes"), id));
    return { id: d.id, ...d.data() };
  }

  if (method === "PATCH" && url.match(/\/api\/ordenes\/([^/]+)\/tecnico/)) {
    const id = url.match(/\/api\/ordenes\/([^/]+)\/tecnico/)![1];
    await updateDoc(doc(db, colName("ordenes"), id), { 
      mecanicoAsignado: data.tecnicoId,
      nombreMecanicoAsignado: data.tecnicoNombre 
    });
    return { success: true };
  }

  if (method === "POST" && url.match(/\/api\/ordenes\/([^/]+)\/pago/)) {
    const id = url.match(/\/api\/ordenes\/([^/]+)\/pago/)![1];
    const pago = { ...data, ordenTrabajoId: id, createdAt: new Date().toISOString() };
    await addDoc(collection(db, colName("pagos")), pago);
    
    const otSnap = await getDoc(doc(db, colName("ordenes"), id));
    if (otSnap.exists()) {
      const current = otSnap.data().montoCobrado || 0;
      await updateDoc(doc(db, colName("ordenes"), id), { montoCobrado: current + parseFloat(data.monto) });
    }
    return pago;
  }

  // --- GARANTIAS ---
  if (method === "GET" && url === "/api/garantias") {
    const snap = await getDocs(collection(db, colName("garantias")));
    const gar = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    const ots = (await getDocs(collection(db, colName("ordenes")))).docs.map(d => ({ id: d.id, ...d.data() }));
    const clientes = (await getDocs(collection(db, colName("clientes")))).docs.map(d => ({ id: d.id, ...d.data() }));
    const vehiculos = (await getDocs(collection(db, colName("vehiculos")))).docs.map(d => ({ id: d.id, ...d.data() }));
    
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
    const snap = await getDocs(collection(db, colName("gastos")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a:any, b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (method === "POST" && url === "/api/gastos") {
    const g = {
      ...data,
      monto: parseFloat(data.monto),
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, colName("gastos")), g);
    return { id: docRef.id, ...g };
  }

  // --- PRESUPUESTOS ---
  if (method === "GET" && url === "/api/presupuestos") {
    const snap = await getDocs(collection(db, colName("presupuestos")));
    const p = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    const clientes = (await getDocs(collection(db, colName("clientes")))).docs.map(d => ({ id: d.id, ...d.data() }));
    const vehiculos = (await getDocs(collection(db, colName("vehiculos")))).docs.map(d => ({ id: d.id, ...d.data() }));
    
    p.forEach(x => {
      x.cliente = clientes.find(c => c.id === x.clienteId);
      x.vehiculo = vehiculos.find(v => v.id === x.vehiculoId);
      x.createdAt = x.createdAt || new Date().toISOString();
    });
    return p.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (method === "POST" && url === "/api/presupuestos") {
    const userStr = localStorage.getItem("fixflow_user");
    const user = userStr ? JSON.parse(userStr) : null;
    
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
      creadoPorId: data.creadoPorId || user?.id || null,
      creadoPorNombre: data.creadoPorNombre || user?.nombre || "Desconocido",
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, colName("presupuestos")), p);
    return { id: docRef.id, ...p };
  }

  if (method === "POST" && url.match(/\/api\/presupuestos\/([^/]+)\/aprobar/)) {
    const id = url.match(/\/api\/presupuestos\/([^/]+)\/aprobar/)![1];
    const { clienteInfo, vehiculoInfo } = data || {};
    
    const pSnap = await getDoc(doc(db, colName("presupuestos"), id));
    if (!pSnap.exists()) throw new Error("No encontrado");
    const p = pSnap.data();
    
    let clienteId = p.clienteId;
    let vehiculoId = p.vehiculoId;

    if (!clienteId) {
      const cRef = await addDoc(collection(db, colName("clientes")), {
        nombre: clienteInfo?.nombre || p.clienteNombre || "Cliente General",
        telefono: clienteInfo?.telefono || p.clienteTelefono,
        email: clienteInfo?.email || null,
        tipo: "PARTICULAR"
      });
      clienteId = cRef.id;
    }

    if (!vehiculoId) {
      const vRef = await addDoc(collection(db, colName("vehiculos")), {
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
      montoCotizado: p.montoEstimado ? parseFloat(p.montoEstimado) : 0,
      montoCobrado: 0,
      estado: "INGRESADO",
      createdAt: new Date().toISOString()
    };
    const otRef = await addDoc(collection(db, colName("ordenes")), ot);
    
    await updateDoc(doc(db, colName("presupuestos"), id), { estado: "APROBADO", clienteId, vehiculoId });
    return { ot: { id: otRef.id, ...ot }, presupuesto: { id, ...p, estado: "APROBADO" } };
  }

  if (method === "PATCH" && url.match(/\/api\/presupuestos\/([^/]+)\/rechazar/)) {
    const id = url.match(/\/api\/presupuestos\/([^/]+)\/rechazar/)![1];
    await updateDoc(doc(db, colName("presupuestos"), id), { estado: "RECHAZADO" });
    return { success: true };
  }

  // --- EVIDENCIAS ---
  if (method === "GET" && url.startsWith("/api/evidencias/presupuesto/")) {
    const parts = url.split("?")[0].split("/");
    const id = parts.pop();
    const categoria = new URLSearchParams(url.split("?")[1] || "").get("categoria") || "GENERAL";
    const snap = await getDocs(query(collection(db, colName("evidencias")), where("presupuestoId", "==", id)));
    const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return allDocs.filter((d: any) => (d.categoria || "GENERAL") === categoria);
  }
  if (method === "GET" && url.startsWith("/api/evidencias/orden/")) {
    const parts = url.split("?")[0].split("/");
    const id = parts.pop();
    const categoria = new URLSearchParams(url.split("?")[1] || "").get("categoria") || "GENERAL";
    const snap = await getDocs(query(collection(db, colName("evidencias")), where("ordenTrabajoId", "==", id)));
    const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return allDocs.filter((d: any) => (d.categoria || "GENERAL") === categoria);
  }
  if (method === "POST" && url === "/api/evidencias") {
    // data is FormData
    const file = data.get("file");
    const descripcion = data.get("descripcion");
    const presupuestoId = data.get("presupuestoId");
    const ordenTrabajoId = data.get("ordenTrabajoId");
    const categoria = data.get("categoria") || "GENERAL";
    
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
      categoria,
      createdAt: new Date().toISOString()
    };
    const ref = await addDoc(collection(db, colName("evidencias")), ev);
    return { id: ref.id, ...ev };
  }

  // --- ENTREGAS ---
  if (method === "POST" && url.match(/\/api\/ordenes\/([^/]+)\/entregar/)) {
    const id = url.match(/\/api\/ordenes\/([^/]+)\/entregar/)![1];
    await updateDoc(doc(db, colName("ordenes"), id), {
      estado: "ENTREGADO",
      datosEntrega: {
        quienRecibe: data.quienRecibe || "",
        notasEntrega: data.notasEntrega || "",
        fechaEntrega: new Date().toISOString()
      }
    });

    // Also create guarantee if we want, or rely on earlier trigger. Let's do it here just in case.
    const gSnap = await getDocs(query(collection(db, colName("garantias")), where("ordenTrabajoId", "==", id)));
    if (gSnap.empty) {
      const d = new Date();
      d.setDate(d.getDate() + 90);
      await addDoc(collection(db, colName("garantias")), {
        tipo: "REPARACION",
        vigenciaDias: 90,
        fechaVencimiento: d.toISOString(),
        ordenTrabajoId: id
      });
    }

    const d = await getDoc(doc(db, colName("ordenes"), id));
    return { id: d.id, ...d.data() };
  }

  throw new Error("Route not mocked: " + method + " " + url);
}

export default api;
