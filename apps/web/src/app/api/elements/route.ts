import { z } from "zod"

import { jsonError, jsonResponse } from "@/lib/api/json-response"
import { parseJsonBody } from "@/lib/api/parse-json-body"
import { elementCreateSchema } from "@/schemas/element.schema"
import { elementCreate, elementsListAll } from "@/services/elements.service"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const elements = await elementsListAll()
        return jsonResponse({ elements })
    } catch (e) {
        console.error("[GET /api/elements]", e)
        return jsonError(500, "Error al listar elementos")
    }
}

export async function POST(request: Request) {
    const parsedBody = await parseJsonBody(request)
    if (!parsedBody.ok) return parsedBody.response

    const result = elementCreateSchema.safeParse(parsedBody.data)
    if (!result.success) {
        return jsonError(400, "Validación fallida", z.treeifyError(result.error))
    }

    const created = await elementCreate(result.data)
    if (!created.ok) {
        return jsonError(400, created.error)
    }

    return jsonResponse({ element: created.data }, { status: 201 })
}
