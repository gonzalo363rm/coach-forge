"use server"

import type { Element } from "@prisma/client"
import { z } from "zod"

import { elementDeleteParamsSchema } from "@/schemas/element.schema"
import { elementDelete } from "@/services/elements.service"

import { revalidateElementsViews } from "./revalidate-elements"
import type { ElementActionResult } from "./types"

export async function deleteElementAction(input: unknown): Promise<ElementActionResult<Element>> {
    const raw = typeof input === "string" ? { id: input } : input
    const parsed = elementDeleteParamsSchema.safeParse(raw)
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await elementDelete(parsed.data.id)
    if (!result.ok) return result

    revalidateElementsViews()
    return { ok: true, data: result.data }
}
