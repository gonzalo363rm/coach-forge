import Link from "next/link"
import clsx from "clsx"

type Props = {
    active: "exercises" | "classes"
}

/**
 * Cambio de sección como páginas distintas (subrayado), no como tabs de filtro.
 */
export function ExploreSubNav({ active }: Props) {
    return (
        <nav
            aria-label="Sección a explorar"
            className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800"
        >
            <Link
                href="/explore/exercises"
                className={clsx(
                    "-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors",
                    active === "exercises"
                        ? "border-emerald-600 text-zinc-900 dark:text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
            >
                Ejercicios
            </Link>
            <Link
                href="/explore/classes"
                className={clsx(
                    "-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors",
                    active === "classes"
                        ? "border-emerald-600 text-zinc-900 dark:text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
            >
                Clases
            </Link>
        </nav>
    )
}
