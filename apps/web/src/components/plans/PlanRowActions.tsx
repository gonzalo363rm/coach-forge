"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import type { CatalogStatus } from "@prisma/client"

import { updatePlanStatusAction } from "@/app/actions/plans"
import { Button, ButtonLink } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type Props = {
    id: string
    status: CatalogStatus
}

export function PlanRowActions({ id, status }: Props) {
    const router = useRouter()
    const { toast } = useToast()
    const [pending, startTransition] = useTransition()
    const nextStatus = status === "active" ? "inactive" : "active"

    function toggleStatus() {
        startTransition(async () => {
            const result = await updatePlanStatusAction({ id, status: nextStatus })
            if (!result.ok) {
                toast({ type: "error", title: "No se pudo cambiar el estado", message: result.error })
                return
            }
            router.refresh()
        })
    }

    return (
        <div className="flex items-center gap-2">
            <ButtonLink href={`/admin/plans/${id}/edit`} variant="secondary" size="sm">
                Editar
            </ButtonLink>
            <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={toggleStatus}
            >
                {pending ? "…" : nextStatus === "inactive" ? "Desactivar" : "Activar"}
            </Button>
        </div>
    )
}
