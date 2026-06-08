"use server"

import { isRedirectError } from "next/dist/client/components/redirect-error"
import { z } from "zod"

import { signIn } from "@/auth"
import { signInSchema } from "@/schemas/auth.schema"
import { authenticateUser } from "@/services/auth.service"

import type { AuthActionResult } from "./types"

type LoginInput = {
  email: string
  password: string
  callbackUrl?: string
}

export async function loginAction(
  input: unknown,
): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validación fallida",
      details: z.treeifyError(parsed.error),
    }
  }

  const authResult = await authenticateUser(parsed.data)
  if (!authResult.ok) {
    return authResult
  }

  const { callbackUrl } = (input ?? {}) as LoginInput

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl?.startsWith("/") ? callbackUrl : "/",
    })
  } catch (error) {
    if (isRedirectError(error)) throw error

    return { ok: false, error: "No se pudo iniciar sesión" }
  }

  return { ok: true, data: undefined }
}
