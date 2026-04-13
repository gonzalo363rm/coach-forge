import { resolve } from "node:path"

import { config as loadEnv } from "dotenv"
import { defineConfig, env } from "prisma/config"

/** Misma URL que en `apps/web/.env` cuando ejecutas Prisma desde la raíz del repo. */
loadEnv({ path: resolve(process.cwd(), "apps/web/.env") })

export default defineConfig({
    schema: "apps/web/prisma/schema.prisma",
    migrations: {
        path: "apps/web/prisma/migrations",
    },
    datasource: {
        url: env("DATABASE_URL"),
    },
})
