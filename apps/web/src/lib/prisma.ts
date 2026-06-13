import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

import { createPgPool } from "@/lib/pg-pool"

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient
    pgPool?: ReturnType<typeof createPgPool>
    prismaAdapter?: PrismaPg
}

function createClient(): PrismaClient {
    const url = process.env.DATABASE_URL?.trim()
    if (!url) {
        throw new Error(
            "DATABASE_URL no está definida. Copia `apps/web/.env.example` a `.env.local`.",
        )
    }
    if (!globalForPrisma.pgPool) {
        globalForPrisma.pgPool = createPgPool(url)
    }
    if (!globalForPrisma.prismaAdapter) {
        globalForPrisma.prismaAdapter = new PrismaPg(globalForPrisma.pgPool, {
            schema: "public",
        })
    }
    return new PrismaClient({ adapter: globalForPrisma.prismaAdapter })
}

/** Cliente singleton (Prisma 7 + adapter `pg`). Se crea al atender la primera petición. */
export function getPrisma(): PrismaClient {
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = createClient()
    }
    return globalForPrisma.prisma
}
