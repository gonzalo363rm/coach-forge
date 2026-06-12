import "dotenv/config"

import { defineConfig } from "prisma/config"

/**
 * `prisma generate` no conecta a la DB; solo necesita una URL válida en el config.
 * En CI/Vercel (postinstall/build) puede no existir DATABASE_URL aún.
 */
const databaseUrl = process.env.DATABASE_URL?.trim() || "postgresql://build:build@127.0.0.1:5432/build?schema=public"

/** Ejecutar comandos Prisma desde `apps/web` (cwd del workspace). */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
})
