"use server"

import { z } from "zod"

import { resetPasswordSchema } from "@/schemas/auth.schema"
import { resetPasswordWithToken } from "@/services/auth.service"

import type { AuthActionResult } from "./types"

export async function resetPasswordAction(
  input: unknown,
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validación fallida",
      details: z.treeifyError(parsed.error),
    }
  }

  return resetPasswordWithToken(parsed.data)
}
