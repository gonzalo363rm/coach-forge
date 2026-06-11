import type { Metadata } from "next"

import { FunErrorPage } from "@/components/errors/FunErrorPage"

export const metadata: Metadata = {
    title: "Sin permisos | Coach Forge",
    description: "No tienes permisos para acceder a esta sección.",
}

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
