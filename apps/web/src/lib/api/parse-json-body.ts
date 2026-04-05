import { MAX_REQUEST_BODY_BYTES } from "@/lib/validation/exercise-schema"

import { jsonError } from "./json-response"

/**
 * Lee y parsea JSON con límite de tamaño. Devuelve `Response` de error o el valor parseado.
 */
export async function parseJsonBody(
    request: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
    const raw = await request.text()
    const bytes = new TextEncoder().encode(raw).length
    if (bytes > MAX_REQUEST_BODY_BYTES) {
        return {
            ok: false,
            response: jsonError(
                413,
                `Cuerpo demasiado grande (máx. ${MAX_REQUEST_BODY_BYTES} bytes)`,
            ),
        }
    }
    if (raw.length === 0) {
        return { ok: false, response: jsonError(400, "Cuerpo vacío") }
    }
    try {
        return { ok: true, data: JSON.parse(raw) as unknown }
    } catch {
        return { ok: false, response: jsonError(400, "JSON inválido") }
    }
}
