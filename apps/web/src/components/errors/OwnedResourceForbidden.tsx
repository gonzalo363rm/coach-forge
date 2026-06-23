import { FunErrorPage } from "./FunErrorPage"

type ResourceType = "exercise" | "class"

type Props = {
    resourceType: ResourceType
    backHref?: string
    backLabel?: string
}

const copy: Record<
    ResourceType,
    { title: string; description: string; hint: string; defaultBackHref: string; defaultBackLabel: string }
> = {
    exercise: {
        title: "Sin permiso para editar",
        description:
            "Este ejercicio pertenece a otro entrenador. Solo el creador o un administrador puede modificarlo.",
        hint: "",
        defaultBackHref: "/exercises/mine",
        defaultBackLabel: "Mis ejercicios",
    },
    class: {
        title: "Sin permiso para editar",
        description:
            "Esta clase pertenece a otro entrenador. Solo el creador o un administrador puede modificarla.",
        hint: "",
        defaultBackHref: "/classes/mine",
        defaultBackLabel: "Mis clases",
    },
}

export function OwnedResourceForbidden({
    resourceType,
    backHref,
    backLabel,
}: Props) {
    const text = copy[resourceType]

    return (
        <FunErrorPage
            code="403"
            icon={
                <span className="inline-block text-7xl" aria-hidden>
                    🚫
                </span>
            }
            title={text.title}
            description={text.description}
            hint={text.hint}
            backHref={backHref ?? text.defaultBackHref}
            backLabel={backLabel ?? text.defaultBackLabel}
        />
    )
}
