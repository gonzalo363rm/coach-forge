"use server"

import type { Sport } from "@prisma/client"
import { z } from "zod"

import { sportDeleteSchema } from "@/schemas/sport.schema"
import { sportsDelete } from "@/services/sports.service"

import { revalidateSportsViews } from "./revalidate-sports"
import type { SportActionResult } from "./types"

export async function deleteSportAction(input: unknown): Promise<SportActionResult<Sport>> {
    const raw = typeof input === "string" ? { id: input } : input
    const parsed = sportDeleteSchema.safeParse(raw)
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await sportsDelete(parsed.data.id)
    if (!result.ok) return result

    revalidateSportsViews()
    return { ok: true, data: result.data }
}
