"use server"

import { z } from "zod"

import { forgotPasswordSchema } from "@/schemas/auth.schema"
import { requestPasswordReset } from "@/services/auth.service"

import type { AuthActionResult } from "./types"

export async function forgotPasswordAction(
  input: unknown,
): Promise<AuthActionResult<{ email: string }>> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validación fallida",
      details: z.treeifyError(parsed.error),
    }
  }

  return requestPasswordReset(parsed.data)
}
