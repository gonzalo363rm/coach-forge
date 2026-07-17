import { Pool, type PoolConfig } from "pg"

function isLocalPostgresUrl(connectionString: string): boolean {
    return /(?:@|\/\/)(?:localhost|127\.0\.0\.1)(?:[:/]|$)/.test(connectionString)
}

function poolConfigFromUrl(connectionString: string): PoolConfig {
    const url = new URL(connectionString)
    const database = url.pathname.replace(/^\//, "").split("/")[0] || undefined
    const isLocal = isLocalPostgresUrl(connectionString)

    const config: PoolConfig = {
        host: url.hostname,
        port: url.port ? Number(url.port) : 5432,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database,
    }

    if (!isLocal) {
        config.ssl = { rejectUnauthorized: false }
    }

    return config
}

/** Pool `pg` (Vercel Postgres, Aiven, etc.). Parsea la URL para evitar conflictos con sslmode. */
export function createPgPool(connectionString: string): Pool {
    return new Pool(poolConfigFromUrl(connectionString))
}
