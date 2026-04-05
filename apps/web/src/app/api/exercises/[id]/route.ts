/**
 * `GET` — un ejercicio por id.
 * `PATCH` — actualización parcial (misma forma que create pero todos los campos opcionales).
 */
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { jsonError, jsonResponse } from "@/lib/api/json-response"
import { parseJsonBody } from "@/lib/api/parse-json-body"
import { getPrisma } from "@/lib/prisma"
import { exerciseUpdateSchema } from "@/lib/validation/exercise-schema"

export const dynamic = "force-dynamic"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
    const { id } = await params
    if (!id) return jsonError(400, "Id requerido")

    try {
        const exercise = await getPrisma().exercise.findUnique({ where: { id } })
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

    const patch = result.data

    const data: Prisma.ExerciseUpdateInput = {}
    if (patch.sportId !== undefined) data.sportId = patch.sportId
    if (patch.title !== undefined) data.title = patch.title
    if (patch.minPlayers !== undefined) data.minPlayers = patch.minPlayers
    if (patch.maxPlayers !== undefined) data.maxPlayers = patch.maxPlayers
    if (patch.difficulty !== undefined) data.difficulty = patch.difficulty
    if (patch.videoLink !== undefined) data.videoLink = patch.videoLink
    if (patch.canvas !== undefined) {
        data.canvas = patch.canvas as unknown as Prisma.InputJsonValue
    }

    try {
        const exercise = await getPrisma().exercise.update({
            where: { id },
            data,
        })
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
