import "dotenv/config"

import { defineConfig, env } from "prisma/config"

/** Ejecutar comandos Prisma desde `apps/web` (cwd del workspace). */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
})
