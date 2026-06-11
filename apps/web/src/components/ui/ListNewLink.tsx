import Link from "next/link"

type Props = {
    href: string
    /** Etiqueta accesible; el texto visible es siempre «Nuevo». */
    ariaLabel: string
}

export const listNewLinkClass =
    "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"

export function ListNewLink({ href, ariaLabel }: Props) {
    return (
        <Link href={href} className={listNewLinkClass} aria-label={ariaLabel}>
            Nuevo
            <span className="text-center font-semibold leading-none" aria-hidden>
                +
            </span>
        </Link>
    )
}
