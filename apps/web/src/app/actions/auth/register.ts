"use server"

import { z } from "zod"

import { registerSchema } from "@/schemas/auth.schema"
import { registerUser } from "@/services/auth.service"

import type { AuthActionResult } from "./types"

export async function registerAction(
  input: unknown,
): Promise<AuthActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validación fallida",
      details: z.treeifyError(parsed.error),
    }
  }

  return registerUser(parsed.data)
}
