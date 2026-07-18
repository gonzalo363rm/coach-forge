"use client"

import { logoutAction } from "@/app/actions/auth"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

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
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleLogout}
      disabled={pending}
    >
      {pending ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  )
}
