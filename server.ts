import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "fixflow_super_secret_dev_only";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.rol;
    if (userRole !== "ADMIN" && !roles.includes(userRole)) {
      res.status(403).json({ error: "Forbidden: insufficient role" });
      return;
    }
    next();
  };
};

async function startServer() {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
  const upload = multer({ storage: storage });

  const app = express();
  const PORT = 3000;

  // Serve uploads
  app.use("/uploads", express.static(uploadsDir));

  app.use(express.json({ limit: "50mb" }));

  // Auth Routes
  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.activo) {
        res.status(401).json({ error: "Credenciales inválidas o usuario inactivo" });
        return;
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Credenciales inválidas" });
        return;
      }
      const token = jwt.sign({ id: user.id, rol: user.rol, nombre: user.nombre }, JWT_SECRET, { expiresIn: "1d" });
      res.json({ token, user: { id: user.id, nombre: user.nombre, rol: user.rol, email: user.email } });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Usuarios
  app.get("/api/usuarios", async (req, res, next) => {
    try {
      const usuarios = await prisma.user.findMany({
        select: { id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true }
      });
      res.json(usuarios);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/usuarios", async (req, res, next) => {
    try {
      const { nombre, email, password, rol } = req.body;
      const exist = await prisma.user.findUnique({ where: { email } });
      if (exist) {
        res.status(400).json({ error: "Email ya registrado" });
        return;
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { nombre, email, passwordHash, rol }
      });
      res.json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol });
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/usuarios/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nombre, email, password, rol, activo } = req.body;
      const data: any = { nombre, email, rol };
      if (activo !== undefined) data.activo = activo;
      if (password) {
        data.passwordHash = await bcrypt.hash(password, 10);
      }
      
      const user = await prisma.user.update({
        where: { id },
        data
      });
      res.json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, activo: user.activo });
    } catch (e) {
      next(e);
    }
  });

  // Ordenes de Trabajo
  app.get("/api/ordenes", async (req, res, next) => {
    try {
      const ordenes = await prisma.ordenTrabajo.findMany({
        include: {
          cliente: true,
          vehiculo: true,
          tecnico: true,
        },
        orderBy: { createdAt: "desc" },
      });
      res.json(ordenes);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/ordenes", async (req, res, next) => {
    try {
      const data = req.body;
      const ot = await prisma.ordenTrabajo.create({
        data: {
          folio: `OT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          origen: data.origen,
          clienteId: data.clienteId,
          vehiculoId: data.vehiculoId,
          descripcion: data.descripcion,
          kilometraje: data.kilometraje ? parseInt(data.kilometraje) : null,
          montoCotizado: data.montoCotizado ? parseFloat(data.montoCotizado) : 0,
          quienPaga: data.quienPaga || 'CLIENTE',
          estado: data.estado || 'INGRESADO',
        }
      });
      res.json(ot);
    } catch (e) {
      next(e);
    }
  });

  // Clientes
  app.get("/api/clientes", async (req, res, next) => {
    try {
      const clientes = await prisma.cliente.findMany({
        include: { vehiculos: true }
      });
      res.json(clientes);
    } catch (e) {
      next(e);
    }
  });

  // Vehiculos
  app.get("/api/vehiculos", async (req, res, next) => {
    try {
      const vehiculos = await prisma.vehiculo.findMany();
      res.json(vehiculos);
    } catch (e) {
      next(e);
    }
  });

  // Aseguradoras
  app.get("/api/aseguradoras", async (req, res, next) => {
    try {
      const aseguradoras = await prisma.aseguradora.findMany({
        include: {
          ots: {
            where: {
              estado: {
                notIn: ['ENTREGADO', 'CANCELADO', 'NO_PROCEDIO']
              }
            }
          }
        }
      });
      res.json(aseguradoras);
    } catch (e) {
      next(e);
    }
  });

  // Gastos
  app.get("/api/gastos", async (req, res, next) => {
    try {
      const gastos = await prisma.gasto.findMany({
        orderBy: { fecha: "desc" }
      });
      res.json(gastos);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/gastos", async (req, res, next) => {
    try {
      const data = req.body;
      const gasto = await prisma.gasto.create({
        data: {
          descripcion: data.descripcion,
          monto: parseFloat(data.monto),
          categoria: data.categoria,
          metodoPago: data.metodoPago,
          ordenTrabajoId: data.ordenTrabajoId || null
        }
      });
      res.json(gasto);
    } catch (e) {
      next(e);
    }
  });

  // Update OT (Estado, Pagos)
  app.patch("/api/ordenes/:id/estado", async (req, res, next) => {
    try {
      const { id } = req.params;
      const { estado, usuarioId = "ADMIN" } = req.body;
      
      const ot = await prisma.ordenTrabajo.update({
        where: { id },
        data: { estado }
      });

      // Crear registro de cambio de estado
      await prisma.cambioEstado.create({
        data: {
          estadoNuevo: estado,
          ordenTrabajoId: id,
          usuarioId: usuarioId // En una app real, vendría del auth
        }
      });

      // Auto-generar Garantia si es 'ENTREGADO'
      if (estado === 'ENTREGADO') {
        const existingGarantia = await prisma.garantia.findUnique({
          where: { ordenTrabajoId: id }
        });
        
        if (!existingGarantia) {
          const vigenciaDias = 90; // Default a 90 días, u obtener de config
          const fechaVencimiento = new Date();
          fechaVencimiento.setDate(fechaVencimiento.getDate() + vigenciaDias);
          
          await prisma.garantia.create({
             data: {
               tipo: "OTRO",
               vigenciaDias,
               fechaVencimiento,
               ordenTrabajoId: id
             }
          });
        }
      }

      res.json(ot);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/ordenes/:id/pago", async (req, res, next) => {
    try {
      const { id } = req.params;
      const { monto, metodo, pagador } = req.body;
      
      const pago = await prisma.pago.create({
        data: {
          monto: parseFloat(monto),
          metodo,
          pagador,
          ordenTrabajoId: id
        }
      });

      // Actualizar monto cobrado
      const ot = await prisma.ordenTrabajo.findUnique({ where: { id } });
      if (ot) {
        await prisma.ordenTrabajo.update({
          where: { id },
          data: { montoCobrado: ot.montoCobrado + parseFloat(monto) }
        });
      }

      res.json(pago);
    } catch (e) {
      next(e);
    }
  });

  // Garantias
  app.get("/api/garantias", async (req, res, next) => {
    try {
      const garantias = await prisma.garantia.findMany({
        include: {
          ordenTrabajo: {
            include: {
              cliente: true,
              vehiculo: true
            }
          }
        },
        orderBy: { fechaVencimiento: 'asc' }
      });
      res.json(garantias);
    } catch (e) {
      next(e);
    }
  });

  // Presupuestos
  app.get("/api/presupuestos", async (req, res, next) => {
    try {
      const presupuestos = await prisma.presupuesto.findMany({
        orderBy: { createdAt: "desc" },
        include: { cliente: true, vehiculo: true, ordenTrabajo: true }
      });
      res.json(presupuestos);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/presupuestos", async (req, res, next) => {
    try {
      const data = req.body;
      const presupuesto = await prisma.presupuesto.create({
        data: {
          folio: `PRE-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`,
          placas: data.placas,
          descripcionDano: data.descripcionDano,
          montoEstimado: data.montoEstimado ? parseFloat(data.montoEstimado) : 0,
          clienteNombre: data.clienteNombre || null,
          clienteTelefono: data.clienteTelefono || null,
          clienteId: data.clienteId || null,
          vehiculoId: data.vehiculoId || null,
        }
      });
      res.json(presupuesto);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/presupuestos/:id/aprobar", async (req, res, next) => {
    try {
      const { id } = req.params;
      const { clienteInfo, vehiculoInfo } = req.body; // Datos para formalizar si no existen

      const presupuesto = await prisma.presupuesto.findUnique({ where: { id } });
      if (!presupuesto) throw new Error("Presupuesto no encontrado");
      if (presupuesto.estado !== "PENDIENTE") throw new Error("El presupuesto no está pendiente");

      let clienteId = presupuesto.clienteId;
      let vehiculoId = presupuesto.vehiculoId;

      // Si no hay cliente formal, crearlo
      if (!clienteId) {
        const nuevoCliente = await prisma.cliente.create({
          data: {
            nombre: clienteInfo?.nombre || presupuesto.clienteNombre || "Cliente General",
            telefono: clienteInfo?.telefono || presupuesto.clienteTelefono,
            email: clienteInfo?.email || null,
          }
        });
        clienteId = nuevoCliente.id;
      }

      // Si no hay vehiculo formal, crearlo
      if (!vehiculoId) {
        const nuevoVehiculo = await prisma.vehiculo.create({
          data: {
            placas: presupuesto.placas,
            marca: vehiculoInfo?.marca || "Desconocida",
            modelo: vehiculoInfo?.modelo || "Desconocido",
            anio: vehiculoInfo?.anio ? parseInt(vehiculoInfo.anio) : new Date().getFullYear(),
            color: vehiculoInfo?.color || "Desconocido",
            clienteId: clienteId!
          }
        });
        vehiculoId = nuevoVehiculo.id;
      }

      // Crear OrdenTrabajo
      const ot = await prisma.ordenTrabajo.create({
        data: {
          folio: `OT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          origen: "PRESUPUESTO",
          presupuestoId: id,
          clienteId: clienteId!,
          vehiculoId: vehiculoId!,
          descripcion: presupuesto.descripcionDano,
          montoCotizado: presupuesto.montoEstimado,
          estado: "INGRESADO"
        }
      });

      // Actualizar presupuesto
      const updatedPresupuesto = await prisma.presupuesto.update({
        where: { id },
        data: {
          estado: "APROBADO",
          clienteId: clienteId,
          vehiculoId: vehiculoId
        }
      });

      res.json({ ot, presupuesto: updatedPresupuesto });
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/presupuestos/:id/rechazar", async (req, res, next) => {
    try {
      const { id } = req.params;
      const p = await prisma.presupuesto.update({
        where: { id },
        data: { estado: "RECHAZADO" }
      });
      res.json(p);
    } catch (e) {
      next(e);
    }
  });

  // Evidencias
  app.get("/api/evidencias/presupuesto/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const evidencias = await prisma.evidencia.findMany({ where: { presupuestoId: id } });
      res.json(evidencias);
    } catch (e) { next(e); }
  });

  app.get("/api/evidencias/orden/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const evidencias = await prisma.evidencia.findMany({ where: { ordenTrabajoId: id } });
      res.json(evidencias);
    } catch (e) { next(e); }
  });

  app.post("/api/evidencias", upload.single("file"), async (req, res, next) => {
    try {
      const { descripcion, presupuestoId, ordenTrabajoId } = req.body;
      const file = req.file;
      
      if (!file) {
        res.status(400).json({ error: "No se proporcionó archivo" });
        return;
      }
      
      const fileUrl = `/uploads/${file.filename}`;

      const evidencia = await prisma.evidencia.create({
        data: {
          urlBase64: fileUrl, // Se reutiliza el campo, pero ahora guarda el URL de Hostinger
          descripcion: descripcion || file.originalname,
          presupuestoId: presupuestoId || null,
          ordenTrabajoId: ordenTrabajoId || null
        }
      });
      res.json(evidencia);
    } catch (e) { next(e); }
  });

  // Error Hander for JSON APIs
  app.use("/api", (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("API Error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
