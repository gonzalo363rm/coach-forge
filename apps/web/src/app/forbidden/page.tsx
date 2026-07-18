import type { Metadata } from "next"

import { FunErrorPage } from "@/components/errors/FunErrorPage"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Sin permisos",
    description: "No tenés permisos para acceder a esta sección de Coach Forge.",
    path: "/forbidden",
    noIndex: true,
})

export default function ForbiddenPage() {
    return (
        <FunErrorPage
            code="403"
            icon={
                <span
                    className="inline-block text-7xl animate-pulse"
                    aria-hidden
                >
                    👑
                </span>
            }
            title="Alguien quiere poder"
            description="Esta zona es solo para administradores. Si necesitas entrar, solicita los permisos primero."
            hint="El banquillo de suplentes también es parte del equipo."
        />
    )
}
