import { Pool, type PoolConfig } from "pg"

function isLocalPostgresUrl(connectionString: string): boolean {
    return /(?:@|\/\/)(?:localhost|127\.0\.0\.1)(?:[:/]|$)/.test(connectionString)
}

/** Pool `pg` con SSL para hosts remotos (Prisma Postgres, Aiven, etc.). */
export function createPgPool(connectionString: string): Pool {
    const config: PoolConfig = { connectionString }

    if (!isLocalPostgresUrl(connectionString)) {
        config.ssl = { rejectUnauthorized: false }
    }

    return new Pool(config)
}
