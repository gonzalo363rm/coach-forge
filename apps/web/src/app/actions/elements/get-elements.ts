"use server"

import { z } from "zod"

import { getElementsPaginatedParamsSchema } from "@/schemas/element.schema"
import {
    elementsListAll,
    elementsListPaginated,
    type ElementsPaginatedData,
} from "@/services/elements.service"
import type { ElementDefinition } from "@/interfaces"

import type { ElementActionResult } from "./types"

export async function getElementsPaginatedAction(
    input: unknown,
): Promise<ElementActionResult<ElementsPaginatedData>> {
    const parsed = getElementsPaginatedParamsSchema.safeParse(input ?? {})
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const { page, take, filters, sortBy, sortDir } = parsed.data
    const f = filters ?? {}
    const result = await elementsListPaginated(
        page,
        take,
        {
            search: f.search ?? undefined,
            sport: f.sport ?? undefined,
        },
        { sortBy, sortDir },
    )
    if (!result.ok) return result

    return { ok: true, data: result.data }
}

export async function getElementsForPaletteAction(): Promise<
    ElementActionResult<ElementDefinition[]>
> {
    try {
        const elements = await elementsListAll()
        return { ok: true, data: elements }
    } catch (e) {
        console.error("[getElementsForPaletteAction]", e)
        return { ok: false, error: "Error al cargar los elementos" }
    }
}
