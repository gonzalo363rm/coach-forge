import { config } from "dotenv"
import { resolve } from "path"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

import { createPgPool } from "../src/lib/pg-pool"

const EMAIL = "admin@admin.com"
const PASSWORD = "admin123"

async function check(label: string, envFile: string): Promise<void> {
  config({ path: resolve(envFile), override: true })
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    console.log(`${label}: sin DATABASE_URL`)
    return
  }

  const host = url.match(/@([^/?:]+)/)?.[1] ?? "?"
  const pool = createPgPool(url)
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool, { schema: "public" }),
  })

  try {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } })
    if (!user) {
      console.log(`${label} (${host}): usuario NO existe`)
      return
    }
    const passwordOk = await bcrypt.compare(PASSWORD, user.passwordHash)
    console.log(
      `${label} (${host}): existe, password=${passwordOk ? "OK" : "MAL"}, verified=${Boolean(user.emailVerified)}, role=${user.role}`,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.log(`${label} (${host}): error`, message)
  } finally {
    await prisma.$disconnect()
  }
}

async function main(): Promise<void> {
  await check("development.local", ".env.development.local")
  await check("env", ".env")
  await check("prod.local", ".env.prod.local")
}

main().catch(console.error)
