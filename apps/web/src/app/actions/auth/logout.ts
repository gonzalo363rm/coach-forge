"use server"

import { isRedirectError } from "next/dist/client/components/redirect-error"

import { signOut } from "@/auth"

import type { AuthActionResult } from "./types"

export async function logoutAction(): Promise<AuthActionResult> {
  try {
    await signOut({ redirectTo: "/login" })
  } catch (error) {
    if (isRedirectError(error)) throw error

    return { ok: false, error: "No se pudo cerrar sesión" }
  }

  return { ok: true, data: undefined }
}
