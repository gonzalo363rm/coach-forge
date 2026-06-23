/**
 * `GET` — un ejercicio por id.
 * `PATCH` — actualización parcial (misma forma que create pero todos los campos opcionales).
 */
import { z } from "zod"

import { jsonError, jsonResponse } from "@/lib/api/json-response"
import { parseJsonBody } from "@/lib/api/parse-json-body"
import { requireExerciseManageAccess, RESOURCE_FORBIDDEN_ERROR } from "@/lib/resource-access"
import { exerciseUpdateSchema } from "@/schemas/exercise.schema"
import { exerciseGetById, exerciseUpdate } from "@/services/exercises.service"

export const dynamic = "force-dynamic"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
    const { id } = await params
    if (!id) return jsonError(400, "Id requerido")

    try {
        const exercise = await exerciseGetById(id)
        if (!exercise) return jsonError(404, "Ejercicio no encontrado")
        return jsonResponse({ exercise })
    } catch (e) {
        console.error("[GET /api/exercises/:id]", e)
        return jsonError(500, "Error al obtener el ejercicio")
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    const { id } = await params
    if (!id) return jsonError(400, "Id requerido")

    const parsedBody = await parseJsonBody(request)
    if (!parsedBody.ok) return parsedBody.response

    const result = exerciseUpdateSchema.safeParse(parsedBody.data)
    if (!result.success) {
        return jsonError(400, "Validación fallida", z.treeifyError(result.error))
    }

    const access = await requireExerciseManageAccess(id)
    if (!access.ok) {
        const status =
            access.error === "No autenticado"
                ? 401
                : access.error === RESOURCE_FORBIDDEN_ERROR
                  ? 403
                  : 404
        return jsonError(status, access.error)
    }

    try {
        const exercise = await exerciseUpdate(id, result.data)
        return jsonResponse({ exercise })
    } catch (e) {
        const code = e && typeof e === "object" && "code" in e ? (e as { code?: string }).code : undefined
        if (code === "P2025") {
            return jsonError(404, "Ejercicio no encontrado")
        }
        console.error("[PATCH /api/exercises/:id]", e)
        return jsonError(500, "Error al actualizar el ejercicio")
    }
}
