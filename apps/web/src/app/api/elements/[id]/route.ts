import { z } from "zod"

import { jsonError, jsonResponse } from "@/lib/api/json-response"
import { parseJsonBody } from "@/lib/api/parse-json-body"
import { elementUpdateSchema } from "@/schemas/element.schema"
import { elementDelete, elementGetById, elementUpdate } from "@/services/elements.service"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
    const { id } = await context.params
    try {
        const element = await elementGetById(id)
        if (!element) {
            return jsonError(404, "Elemento no encontrado")
        }
        return jsonResponse({ element })
    } catch (e) {
        console.error("[GET /api/elements/:id]", e)
        return jsonError(500, "Error al obtener el elemento")
    }
}

export async function PATCH(request: Request, context: RouteContext) {
    const { id } = await context.params
    const parsedBody = await parseJsonBody(request)
    if (!parsedBody.ok) return parsedBody.response

    const result = elementUpdateSchema.safeParse({
        id,
        ...(typeof parsedBody.data === "object" && parsedBody.data !== null
            ? (parsedBody.data as Record<string, unknown>)
            : {}),
    })
    if (!result.success) {
        return jsonError(400, "Validación fallida", z.treeifyError(result.error))
    }

    const updated = await elementUpdate(result.data)
    if (!updated.ok) {
        return jsonError(400, updated.error)
    }

    return jsonResponse({ element: updated.data })
}

export async function DELETE(_request: Request, context: RouteContext) {
    const { id } = await context.params
    const deleted = await elementDelete(id)
    if (!deleted.ok) {
        const status = deleted.error.includes("no encontrado") ? 404 : 400
        return jsonError(status, deleted.error)
    }
    return jsonResponse({ element: deleted.data })
}
