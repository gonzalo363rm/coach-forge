"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { IoArrowDownOutline, IoArrowUpOutline } from "react-icons/io5"

import { tableHeaderThClass } from "@/components/ui/table/table-header"

type SortDir = "asc" | "desc"

type Props = {
    column: string
    label: string
    currentSortBy: string
    currentSortDir: SortDir
    /**
     * Dirección a usar al activar una columna por primera vez.
     * Por defecto "asc".
     */
    defaultDir?: SortDir
    /** Nombre del query param para la columna. Por defecto "sortBy". */
    sortByParam?: string
    /** Nombre del query param para la dirección. Por defecto "sortDir". */
    sortDirParam?: string
    /**
     * Param de paginación a resetear cuando cambia el orden.
     * Por defecto "page".
     */
    resetPageParam?: string
}

export function SortableTh({
    column,
    label,
    currentSortBy,
    currentSortDir,
    defaultDir = "asc",
    sortByParam = "sortBy",
    sortDirParam = "sortDir",
    resetPageParam = "page",
}: Props) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const isActive = currentSortBy === column
    const nextDir: SortDir = isActive
        ? currentSortDir === "asc"
            ? "desc"
            : "asc"
        : defaultDir

    const p = new URLSearchParams(searchParams.toString())
    p.set(sortByParam, column)
    p.set(sortDirParam, nextDir)
    if (resetPageParam) p.delete(resetPageParam)

    const href = `${pathname}?${p.toString()}`

    const sortLabel = isActive
        ? `${label}, orden ${currentSortDir === "asc" ? "ascendente" : "descendente"}. Clic para invertir`
        : `${label}. Clic para ordenar`

    return (
        <th
            scope="col"
            aria-sort={
                isActive
                    ? currentSortDir === "asc"
                        ? "ascending"
                        : "descending"
                    : "none"
            }
            className={tableHeaderThClass}
        >
            <Link
                href={href}
                prefetch={false}
                className="inline-flex items-center gap-1 rounded-md py-0.5 text-inherit no-underline outline-none transition-colors hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:hover:text-emerald-400 dark:focus-visible:ring-offset-zinc-950"
                aria-label={sortLabel}
            >
                <span>{label}</span>
                {isActive ? (
                    currentSortDir === "asc" ? (
                        <IoArrowUpOutline
                            className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                            aria-hidden
                        />
                    ) : (
                        <IoArrowDownOutline
                            className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                            aria-hidden
                        />
                    )
                ) : null}
            </Link>
        </th>
    )
}

