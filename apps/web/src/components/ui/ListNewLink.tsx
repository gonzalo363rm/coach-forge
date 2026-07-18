import { ButtonLink } from "@/components/ui/button"

type Props = {
    href: string
    /** Etiqueta accesible; el texto visible es siempre «Nuevo». */
    ariaLabel: string
}

export function ListNewLink({ href, ariaLabel }: Props) {
    return (
        <ButtonLink href={href} variant="secondary" size="md" aria-label={ariaLabel}>
            Nuevo
            <span className="text-center font-semibold leading-none" aria-hidden>
                +
            </span>
        </ButtonLink>
    )
}
