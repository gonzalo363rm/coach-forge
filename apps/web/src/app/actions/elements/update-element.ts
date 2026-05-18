"use server"

import type { Element } from "@prisma/client"
import { z } from "zod"

import { elementUpdateSchema } from "@/schemas/element.schema"
import { elementUpdate } from "@/services/elements.service"

import { revalidateElementsViews } from "./revalidate-elements"
import type { ElementActionResult } from "./types"

export async function updateElementAction(
    input: unknown,
): Promise<ElementActionResult<Element>> {
    const parsed = elementUpdateSchema.safeParse(input)
    if (!parsed.success) {
        const issues = parsed.error.issues
        const error = issues.map((i) => i.message).filter(Boolean).join(" ") || "Validación fallida"
        return {
            ok: false,
            error,
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await elementUpdate(parsed.data)
    if (!result.ok) return result

    revalidateElementsViews()
    return { ok: true, data: result.data }
}
