const path = require("path");
const fs = require("fs");
const { scryptSync } = require("crypto");

// 1. CARGA ROBUSTA DE CONFIGURACIÓN (Igual que server.js)
const isProdMode = process.env.NODE_ENV === "production";
let envPath = path.resolve(
  __dirname,
  "..",
  isProdMode ? ".env.production" : ".env",
);

if (!fs.existsSync(envPath)) {
  envPath = path.resolve(__dirname, "..", ".env");
}

require("dotenv").config({ path: envPath });
console.log(`[Seed] Cargando variables desde: ${path.basename(envPath)}`);

// 2. Verificamos que DATABASE_URL esté presente antes de requerir database.js.
if (!process.env.DATABASE_URL) {
  console.error(
    "❌ [Seed] ERROR: DATABASE_URL no está definida en el entorno.",
  );
  console.error(
    "   Asegúrate de que el archivo .env existe en la raíz y tiene el formato correcto.",
  );
  process.exit(1);
}

// Importamos la instancia. Si el adaptador manual no expone 'user',
// intentamos usar la instancia interna del cliente.
let prisma = require("../backend/database");
// Verificación de seguridad: si prisma.user no existe, el adaptador manual está incompleto.
const prismaInstance = prisma.user ? prisma : prisma.prisma || prisma;
const db = prisma.user ? prisma : prismaInstance;

const HASH_SALT = process.env.HASH_SALT || "winner_secure_salt_2026";

async function main() {
  console.log("🌱 Iniciando siembra de datos (Seed) en PostgreSQL...");

  // 1. Crear o actualizar usuario administrador inicial
  const adminUser = process.env.ADMIN_USER || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "winner2026";
  // Usar SMTP_USER o EMAIL_USER para consistencia
  const adminEmail = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim().toLowerCase() || null;

  if (!adminEmail) {
    console.warn("⚠️ [Seed] ADVERTENCIA: La variable EMAIL_USER no está definida en el .env.");
    console.warn("   El usuario administrador se creará SIN correo electrónico.");
  }
  // Generar hash de la contraseña
  const passwordHash = scryptSync(adminPass, HASH_SALT, 64).toString("hex");

  console.log(`[*] Sincronizando hash para el usuario: ${adminUser} con salt: ${HASH_SALT.substring(0, 5)}...`);

  // Usamos upsert para asegurar que el admin tenga el email correcto incluso si ya existía
  await db.user.upsert({
    where: { username: adminUser },
    update: {
      email: adminEmail,
      password: passwordHash,
      active: true,
    },
    create: {
      username: adminUser,
      email: adminEmail,
      password: passwordHash,
      role: "admin",
      active: true,
    },
  });
  console.log(
    `👤 [Seed] ¡SINCRO OK! -> Usuario: ${adminUser} | Email: ${adminEmail || "⚠️ NO DEFINIDO EN .ENV"}`,
  );
  const check = await db.user.findUnique({ where: { username: adminUser } });
  console.log(`📊 [Seed] Verificación en DB: El correo guardado es [${check.email}]`);
  console.log(`👤 Usuario administrador sincronizado: ${adminUser} (${adminEmail || "sin email"})`);

  // 2. Definición de productos iniciales (Muestra representativa de los 26)
  // Catálogo actualizado para reflejar un inventario de tienda física más realista.
  const initialProducts = [
    {
      id: "P001",
      sku: "WIN-P001",
      name: "Camiseta Oversize 'Legacy' Black",
      price: 85000,
      cost: 35000,
      category: "Camisetas Caballero",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
      badge: "Nuevo",
      description: "Camiseta de algodón pesado (240g), corte oversize, estampado minimalista en el pecho.",
    },
    {
      id: "P002",
      sku: "WIN-P002",
      name: "Hoodie 'Essential' Gris Melange",
      price: 145000,
      cost: 75000,
      category: "Hoodies Dama",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500",
      badge: "Top Ventas",
      description: "Buso con capota en french terry perchado, suave al tacto y de alta durabilidad.",
    },
    {
      id: "P003",
      sku: "WIN-P003",
      name: "Jogger Cargo 'Tech' Negro",
      price: 115000,
      cost: 55000,
      category: "Joggers Caballero",
      image: "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=500",
      badge: "Oferta",
      description: "Pantalón jogger en tela antifluido con 6 bolsillos funcionales y bota ajustable.",
    },
    {
      id: "P004",
      sku: "WIN-P004",
      name: "Conjunto Deportivo 'Motion' Dama",
      price: 130000,
      cost: 65000,
      category: "Conjuntos Dama",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500",
      badge: "Nuevo",
      description: "Set de top y legging en lycra de alta compresión, ideal para entrenamiento.",
    },
    {
      id: "P005",
      sku: "WIN-P005",
      name: "Chaqueta 'Bomber' Verde Militar",
      price: 180000,
      cost: 90000,
      category: "Chaquetas",
      image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500",
      badge: "Limitado",
      description: "Chaqueta tipo bomber con forro interno y cremalleras metálicas.",
    },
    {
      id: "P026",
      sku: "WIN-P026",
      name: "Tenis 'Urban Runner' Blanco",
      price: 450000,
      cost: 280000,
      category: "calzado",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
      badge: "Popular",
      description: "Calzado importado calidad G5, suela de caucho y cuerpo en cuero sintético.",
    },
    {
      id: "A001",
      sku: "WIN-A001",
      name: "Gorra Trucker 'W' Logo",
      price: 45000,
      cost: 15000,
      category: "Accesorios",
      badge: "Nuevo",
      image: "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=500",
      description: "Gorra tipo camionero con malla trasera y logo 'W' bordado en 3D.",
    },
    {
      id: "A002",
      sku: "WIN-A002",
      name: "Riñonera 'Crossbody' Reflectiva",
      price: 75000,
      cost: 30000,
      category: "Accesorios",
      image: "https://images.unsplash.com/photo-1606522749860-598166136245?w=500",
      badge: "Limitado",
      description: "Riñonera cruzada con detalles reflectivos y múltiples compartimentos.",
    },
  ];

  for (const pData of initialProducts) {
    // 1. Limpieza de datos: Extraemos solo lo que el modelo Product de Prisma/Postgres reconoce.
    const { id, sku, name, price, cost, category, image, badge, description } = pData;
    const cleanData = { id, sku, name, price, cost, category, image, badge, description };

    const product = await db.product.upsert({
      where: { id: cleanData.id },
      update: {
        sku: cleanData.sku,
        name: cleanData.name,
        price: cleanData.price,
        cost: cleanData.cost || 0,
        category: cleanData.category,
        image: cleanData.image,
        badge: cleanData.badge || null,
        description: cleanData.description || null,
      },
      create: {
        ...cleanData,
        cost: cleanData.cost || 0,
        category: cleanData.category,
        badge: cleanData.badge || null,
        description: cleanData.description || null,
      },
    });

    // 3. GENERACIÓN INTELIGENTE DE INVENTARIO Y LIMPIEZA DE DUPLICADOS
    const c = pData.category.toLowerCase();
    const isNumericBottom =
      (c.includes("pantal") ||
        c.includes("jean") ||
        c.includes("jogger") ||
        c.includes("cargo") ||
        c.includes("bermuda")) &&
      !c.includes("legging") &&
      !c.includes("conjunto");

    const isLetterSize =
      c.includes("ropa") ||
      c.includes("camiseta") ||
      c.includes("hoodie") ||
      c.includes("legging") ||
      c.includes("conjunto") ||
      c.includes("set") ||
      c.includes("top") ||
      c.includes("buso") ||
      c.includes("sudadera") ||
      c.includes("chaqueta") ||
      c.includes("camisa") ||
      c.includes("oversize");

    let validSizes = [];

    if (isNumericBottom) {
      validSizes =
        c.includes("dama") || c.includes("mujer")
          ? ["6", "8", "10", "12", "14"]
          : ["30", "32", "34", "36"];

      for (const size of validSizes) {
        const barcode = `770${product.id.replace(/\D/g, "")}${size}`;
        await db.inventory.upsert({
          where: { productId_size: { productId: product.id, size } },
          update: {},
          create: {
            productId: product.id,
            size,
            quantity: 12,
            barcode,
            minStock: 2,
          },
        });
      }
    } else if (isLetterSize) {
      validSizes = ["S", "M", "L", "XL"];
      for (const size of validSizes) {
        const barcode = `770${product.id.replace(/\D/g, "")}${size.charCodeAt(0)}`;
        await db.inventory.upsert({
          where: { productId_size: { productId: product.id, size } },
          update: {}, // No sobreescribimos la cantidad si ya existe para no perder cambios manuales
          create: {
            productId: product.id,
            size,
            quantity: 15,
            barcode,
            minStock: 3,
          },
        });
      }
    } else if (pData.category === "calzado") {
      validSizes = ["38", "39", "40", "41", "42"];
      for (const size of validSizes) {
        const barcode = `880${product.id.replace(/\D/g, "")}${size}`;
        await db.inventory.upsert({
          where: { productId_size: { productId: product.id, size } },
          update: {},
          create: {
            productId: product.id,
            size,
            quantity: 5,
            barcode,
            minStock: 1,
          },
        });
      }
    } else {
      validSizes = ["U"];
      const barcode = `990${product.id.replace(/\D/g, "")}`;
      await db.inventory.upsert({
        where: { productId_size: { productId: product.id, size: "U" } },
        update: {},
        create: {
          productId: product.id,
          size: "U",
          quantity: 100,
          barcode,
          minStock: 5,
        },
      });
    }

    // --- VALIDACIÓN DE DUPLICADOS: Limpiar tallas que ya no corresponden ---
    // Si el producto tenía tallas viejas (ej. cambió de Ropa a Calzado), las borramos.
    await db.inventory.deleteMany({
      where: {
        productId: product.id,
        size: { notIn: validSizes },
      },
    });
  }

  // 4. Generar una venta de prueba para el historial
  const sampleSaleId = "SALE-SEED-001";
  const existingSale = await db.sale.findUnique({
    where: { id: sampleSaleId },
  });

  if (!existingSale) {
    console.log("📝 Generando venta de prueba...");
    await db.sale.create({
      data: {
        id: sampleSaleId,
        customerName: "Cliente de Prueba",
        customerEmail: "prueba@winner.com",
        customerPhone: "573000000000",
        totalAmount: 130000,
        paymentMethod: "Efectivo",
        paymentStatus: "completed",
        referenceNumber: "REF-SEED-001",
        items: {
          create: [
            {
              productId: "P004",
              product_name: "Set Legging + Top W",
              size: "M",
              quantity: 1,
              unitPrice: 130000,
            },
          ],
        },
        salePayments: {
          create: [
            {
              amount: 130000,
              method: "Efectivo",
              notes: "Pago inicial completo (Seed)",
            },
          ],
        },
        orders: {
          create: [
            {
              id: "ORD-SEED-001",
              status: "ENTREGADO",
              shippingMethod: "Recogida local",
              shippingAddress: "Tienda Principal",
            },
          ],
        },
      },
    });
    console.log("✅ Venta de prueba creada.");
  }

  console.log("✅ Base de Datos PostgreSQL sincronizada con éxito.");
}

main()
  .catch((e) => {
    console.error("❌ Error en el Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Desconectar adecuadamente según la estructura de exports de database.js
    if (db.$disconnect) {
      await db.$disconnect();
    } else if (db.prisma && db.prisma.$disconnect) {
      await db.prisma.$disconnect();
    }
  });
