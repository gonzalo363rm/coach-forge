"use server"

import type { Sport } from "@prisma/client"
import { z } from "zod"

import { sportUpdateSchema } from "@/schemas/sport.schema"
import { sportsUpdate } from "@/services/sports.service"

import { revalidateSportsViews } from "./revalidate-sports"
import type { SportActionResult } from "./types"

export async function updateSportAction(input: unknown): Promise<SportActionResult<Sport>> {
    const parsed = sportUpdateSchema.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await sportsUpdate(parsed.data)
    if (!result.ok) return result

    revalidateSportsViews()
    return { ok: true, data: result.data }
}
