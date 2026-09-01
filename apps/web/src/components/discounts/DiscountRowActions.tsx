"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import type { CatalogStatus } from "@prisma/client"

import { updateDiscountStatusAction } from "@/app/actions/discounts"
import { Button, ButtonLink } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type Props = {
    id: string
    status: CatalogStatus
}

export function DiscountRowActions({ id, status }: Props) {
    const router = useRouter()
    const { toast } = useToast()
    const [pending, startTransition] = useTransition()
    const nextStatus = status === "active" ? "inactive" : "active"

    return (
        <div className="flex items-center gap-2">
            <ButtonLink href={`/admin/discounts/${id}/edit`} variant="secondary" size="sm">
                Editar
            </ButtonLink>
            <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => {
                    startTransition(async () => {
                        const result = await updateDiscountStatusAction({ id, status: nextStatus })
                        if (!result.ok) {
                            toast({
                                type: "error",
                                title: "No se pudo cambiar el estado",
                                message: result.error,
                            })
                            return
                        }
                        router.refresh()
                    })
                }}
            >
                {pending ? "…" : nextStatus === "inactive" ? "Desactivar" : "Activar"}
            </Button>
        </div>
    )
}
