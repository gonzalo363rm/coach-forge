"use client"

import { logoutAction } from "@/app/actions/auth"
import { useTransition } from "react"

import { useToast } from "@/components/ui/toast/ToastProvider"

export function LogoutButton() {
  const [pending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleLogout() {
    startTransition(async () => {
      const result = await logoutAction()

      if (!result.ok) {
        toast({ message: result.error, type: "error" })
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {pending ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  )
}
