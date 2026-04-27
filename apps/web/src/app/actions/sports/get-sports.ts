"use server"

import type { Sport } from "@prisma/client"
import { z } from "zod"

import { getSportsPaginatedParamsSchema } from "@/schemas/sport.schema"
import {
    sportsListAll,
    sportsListPaginated,
    type SportsPaginatedData,
} from "@/services/sports.service"

import type { SportActionResult } from "./types"

export async function getSportsAllAction(): Promise<SportActionResult<Sport[]>> {
    try {
        const sports = await sportsListAll()
        return { ok: true, data: sports }
    } catch (e) {
        console.error("[getSportsAllAction]", e)
        return { ok: false, error: "Error al cargar deportes" }
    }
}

export async function getSportsPaginatedAction(
    input: unknown,
): Promise<SportActionResult<SportsPaginatedData>> {
    const parsed = getSportsPaginatedParamsSchema.safeParse(input ?? {})
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const { page, take, filters, sortBy, sortDir } = parsed.data
    const f = filters ?? {}
    const result = await sportsListPaginated(
        page,
        take,
        { search: f.search ?? undefined },
        { sortBy, sortDir },
    )
    if (!result.ok) return result

    return { ok: true, data: result.data }
}
