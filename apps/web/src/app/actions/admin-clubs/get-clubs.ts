"use server"

import { z } from "zod"

import { requireAdmin } from "@/lib/require-admin"
import { getClubsPaginatedParamsSchema } from "@/schemas/club.schema"
import {
    clubsListForSelect,
    clubsListPaginated,
    type ClubSelectOption,
    type ClubsPaginatedData,
} from "@/services/clubs.service"

import type { ClubAdminActionResult } from "./types"

export async function getClubsPaginatedAction(
    input: unknown,
): Promise<ClubAdminActionResult<ClubsPaginatedData>> {
    const admin = await requireAdmin()
    if (!admin.ok) return admin

    const parsed = getClubsPaginatedParamsSchema.safeParse(input ?? {})
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const { page, take, filters, sortBy, sortDir } = parsed.data
    const result = await clubsListPaginated(page, take, filters ?? {}, {
        sortBy,
        sortDir,
    })
    if (!result.ok) return result

    return { ok: true, data: result.data }
}

export async function getClubsForSelectAction(): Promise<
    ClubAdminActionResult<ClubSelectOption[]>
> {
    const admin = await requireAdmin()
    if (!admin.ok) return admin

    try {
        const clubs = await clubsListForSelect()
        return { ok: true, data: clubs }
    } catch (e) {
        console.error("[getClubsForSelectAction]", e)
        return { ok: false, error: "Error al cargar clubes" }
    }
}
