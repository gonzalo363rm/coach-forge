/**
 * API REST JSON de ejercicios.
 *
 * - `POST` — crea; cuerpo alineado con el tipo `Exercise` del cliente (sin `id` en el payload).
 * - `GET` — lista ordenada por `updatedAt` descendente.
 */
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { jsonError, jsonResponse } from "@/lib/api/json-response"
import { parseJsonBody } from "@/lib/api/parse-json-body"
import { getPrisma } from "@/lib/prisma"
import { exerciseCreateSchema } from "@/lib/validation/exercise-schema"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const exercises = await getPrisma().exercise.findMany({
            orderBy: { updatedAt: "desc" },
        })
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

    const data = result.data

    try {
        const exercise = await getPrisma().exercise.create({
            data: {
                sportId: data.sportId,
                title: data.title,
                minPlayers: data.minPlayers,
                maxPlayers: data.maxPlayers,
                difficulty: data.difficulty,
                videoLink: data.videoLink,
                canvas: data.canvas as unknown as Prisma.InputJsonValue,
            },
        })
        return jsonResponse({ exercise }, { status: 201 })
    } catch (e) {
        console.error("[POST /api/exercises]", e)
        return jsonError(500, "Error al guardar el ejercicio")
    }
}
