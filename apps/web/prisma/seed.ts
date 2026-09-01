import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"
import { type PermissionValueKind, type PlanType, PrismaClient } from "@prisma/client"
import bcryptjs from "bcryptjs"

import { createPgPool } from "../src/lib/pg-pool"

const SUPERADMIN_EMAIL = "admin@admin.com"
const SUPERADMIN_PASSWORD = "admin123"

const PRODUCT_PERMISSIONS: {
  code: string
  name: string
  description: string
  valueKind: PermissionValueKind
  appliesToPlanType: PlanType | null
}[] = [
  {
    code: "create_exercise",
    name: "Crear ejercicios",
    description: "Permite crear ejercicios.",
    valueKind: "flag",
    appliesToPlanType: null,
  },
  {
    code: "edit_exercise",
    name: "Editar ejercicios",
    description: "Permite editar ejercicios.",
    valueKind: "flag",
    appliesToPlanType: null,
  },
  {
    code: "delete_exercise",
    name: "Eliminar ejercicios",
    description: "Permite eliminar ejercicios.",
    valueKind: "flag",
    appliesToPlanType: null,
  },
  {
    code: "create_class",
    name: "Crear clases",
    description: "Permite crear clases.",
    valueKind: "flag",
    appliesToPlanType: null,
  },
  {
    code: "edit_class",
    name: "Editar clases",
    description: "Permite editar clases.",
    valueKind: "flag",
    appliesToPlanType: null,
  },
  {
    code: "delete_class",
    name: "Eliminar clases",
    description: "Permite eliminar clases.",
    valueKind: "flag",
    appliesToPlanType: null,
  },
  {
    code: "start_class",
    name: "Utilizar / comenzar clase",
    description: "Permite comenzar o utilizar una clase.",
    valueKind: "flag",
    appliesToPlanType: null,
  },
  {
    code: "access_public_exercise",
    name: "Acceso a ejercicios públicos",
    description: "Permite acceder a ejercicios con visibilidad pública.",
    valueKind: "flag",
    appliesToPlanType: null,
  },
  {
    code: "access_public_class",
    name: "Acceso a clases públicas",
    description: "Permite acceder a clases con visibilidad pública.",
    valueKind: "flag",
    appliesToPlanType: null,
  },
  {
    code: "access_club_exercise",
    name: "Acceso a ejercicios del club",
    description: "Permite acceder a ejercicios con visibilidad de club.",
    valueKind: "flag",
    appliesToPlanType: "club",
  },
  {
    code: "access_club_class",
    name: "Acceso a clases del club",
    description: "Permite acceder a clases con visibilidad de club.",
    valueKind: "flag",
    appliesToPlanType: "club",
  },
  {
    code: "max_classes_per_month",
    name: "Clases mensuales",
    description: "Tope de clases creadas por mes. Sin valor = ilimitado.",
    valueKind: "limit",
    appliesToPlanType: null,
  },
  {
    code: "max_exercises_per_month",
    name: "Ejercicios mensuales",
    description: "Tope de ejercicios creados por mes. Sin valor = ilimitado.",
    valueKind: "limit",
    appliesToPlanType: null,
  },
  {
    code: "max_club_members",
    name: "Máximo de miembros del club",
    description: "Tope de coaches del club. Sin valor = ilimitado.",
    valueKind: "limit",
    appliesToPlanType: "club",
  },
]

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error("DATABASE_URL no está definida.")
  }

  const pool = createPgPool(url)
  const adapter = new PrismaPg(pool, { schema: "public" })
  return new PrismaClient({ adapter })
}

async function main(): Promise<void> {
  const prisma = createPrismaClient()
  const passwordHash = await bcryptjs.hash(SUPERADMIN_PASSWORD, 12)

  const user = await prisma.user.upsert({
    where: { email: SUPERADMIN_EMAIL },
    update: {
      firstName: "Super",
      lastName: "Admin",
      role: "superadmin",
      passwordHash,
      emailVerified: new Date(),
    },
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: SUPERADMIN_EMAIL,
      passwordHash,
      role: "superadmin",
      emailVerified: new Date(),
    },
  })

  console.log(`Superadmin listo: ${user.email} (${user.role})`)

  for (const permission of PRODUCT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        description: permission.description,
        valueKind: permission.valueKind,
        appliesToPlanType: permission.appliesToPlanType,
        status: "active",
      },
      create: permission,
    })
  }

  console.log(`Permisos de producto: ${PRODUCT_PERMISSIONS.length}`)
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
