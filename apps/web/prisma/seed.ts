import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcryptjs from "bcryptjs"

import { createPgPool } from "../src/lib/pg-pool"

const SUPERADMIN_EMAIL = "admin@admin.com"
const SUPERADMIN_PASSWORD = "admin123"

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
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
