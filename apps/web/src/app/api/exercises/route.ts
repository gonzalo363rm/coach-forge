/**
 * API REST JSON de ejercicios.
 *
 * - `POST` — crea; cuerpo alineado con el tipo `Exercise` del cliente (sin `id` en el payload).
 * - `GET` — lista ordenada por `updatedAt` descendente.
 */
import { z } from "zod"

import { jsonError, jsonResponse } from "@/lib/api/json-response"
import { parseJsonBody } from "@/lib/api/parse-json-body"
import { getAuthenticatedUserId } from "@/lib/get-authenticated-user-id"
import { exerciseCreateSchema } from "@/schemas/exercise.schema"
import { exerciseCreate, exercisesList } from "@/services/exercises.service"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const exercises = await exercisesList()
        return jsonResponse({ exercises })
    } catch (e) {
        console.error("[GET /api/exercises]", e)
        return jsonError(500, "Error al listar ejercicios")
    }
}

/**
 * Crea un ejercicio. Body: coincide con `Exercise` del cliente (sin `id`).
 * Valida con Zod antes de persistir.
 */
export async function POST(request: Request) {
    const parsedBody = await parseJsonBody(request)
    if (!parsedBody.ok) return parsedBody.response

    const result = exerciseCreateSchema.safeParse(parsedBody.data)
    if (!result.success) {
        return jsonError(400, "Validación fallida", z.treeifyError(result.error))
    }

    try {
        const creatorId = await getAuthenticatedUserId()
        const exercise = await exerciseCreate(result.data, creatorId)
        return jsonResponse({ exercise }, { status: 201 })
    } catch (e) {
        console.error("[POST /api/exercises]", e)
        return jsonError(500, "Error al guardar el ejercicio")
    }
}
