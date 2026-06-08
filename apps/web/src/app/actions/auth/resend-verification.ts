"use server"

import { z } from "zod"

import { signInSchema } from "@/schemas/auth.schema"
import { resendVerificationEmail } from "@/services/auth.service"

import type { AuthActionResult } from "./types"

export async function resendVerificationAction(
  input: unknown,
): Promise<AuthActionResult<{ email: string }>> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validación fallida",
      details: z.treeifyError(parsed.error),
    }
  }

  return resendVerificationEmail(parsed.data)
}
