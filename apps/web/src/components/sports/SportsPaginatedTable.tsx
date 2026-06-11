"use client"

import { deleteSportAction } from "@/app/actions/sports"
import { SportRowActions } from "@/components/sports/SportRowActions"
import { Pagination } from "@/components/ui/pagination/Pagination"
import {
    listFilterButtonClass,
    listFilterFormClass,
    listFilterSearchClass,
} from "@/components/ui/table/list-filter-bar"
import { SortableTh } from "@/components/ui/table/SortableTh"
import { tableHeaderThClass } from "@/components/ui/table/table-header"
import { useToast } from "@/components/ui/toast/ToastProvider"
import type { SportListSortBy } from "@/schemas/sport.schema"
import type { Sport } from "@prisma/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { useCallback, useOptimistic, useTransition } from "react"

type Props = {
    sports: Sport[]
    totalPages: number
    listState: {
        search: string
        sortBy: SportListSortBy
        sortDir: "asc" | "desc"
    }
}

interface FormData {
    search: string
}

function defaultSortDir(column: SportListSortBy): "asc" | "desc" {
    switch (column) {
        case "createdAt":
            return "desc"
        case "name":
        default:
            return "asc"
    }
}

export function SportsPaginatedTable({ sports, totalPages, listState }: Props) {
    const router = useRouter()
    const { toast } = useToast()
    const [, startTransition] = useTransition()
    const { register, handleSubmit } = useForm<FormData>({
        defaultValues: { search: listState.search },
    })
    const [optimisticSports, removeSportOptimistic] = useOptimistic(
        sports,
        (current, deletedId: string) => current.filter((s) => s.id !== deletedId),
    )

    const deleteSport = useCallback(
        (id: string) =>
            new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
                startTransition(async () => {
                    removeSportOptimistic(id)
                    const result = await deleteSportAction(id)
                    if (result.ok) {
                        router.refresh()
                        resolve({ ok: true })
                    } else {
                        toast({
                            type: "error",
                            title: "No se pudo eliminar el deporte",
                            message: result.error,
                        })
                        router.refresh()
                        resolve({ ok: false, error: result.error })
                    }
                })
            }),
        [removeSportOptimistic, router, toast],
    )

    const onSubmit = (data: FormData) => {
        const p = new URLSearchParams()
        const q = data.search?.trim()
        if (q) p.set("search", q)
        p.set("sortBy", listState.sortBy)
        p.set("sortDir", listState.sortDir)
        router.push(`/admin/sports?${p.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={handleSubmit(onSubmit)} className={listFilterFormClass}>
                <input
                    id="search"
                    {...register("search")}
                    type="text"
                    placeholder="Buscar por nombre o slug"
                    className={listFilterSearchClass}
                />
                <button type="submit" className={listFilterButtonClass}>
                    Buscar
                </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-100 dark:bg-zinc-900">
                            <tr>
                                <th
                                    scope="col"
                                    className={tableHeaderThClass}
                                >
                                    ID
                                </th>

                                <SortableTh
                                    column="name"
                                    label="Nombre"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("name")}
                                />

                                <th
                                    scope="col"
                                    className={tableHeaderThClass}
                                >
                                    Slug
                                </th>

                                <SortableTh
                                    column="createdAt"
                                    label="Creado"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("createdAt")}
                                />

                                <th
                                    scope="col"
                                    className={tableHeaderThClass}
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                            {optimisticSports.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
                                    >
                                        No hay deportes con estos filtros.{" "}
                                        <Link
                                            href="/admin/sports/new"
                                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                        >
                                            Crear el primero
                                        </Link>
                                        .
                                    </td>
                                </tr>
                            ) : (
                                optimisticSports.map((sport) => (
                                    <tr
                                        key={sport.id}
                                        className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                                    >
                                        <td className="whitespace-nowrap px-4 py-2 font-mono text-sm text-zinc-600 dark:text-zinc-400">
                                            {sport.id}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {sport.name}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {sport.slug}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            {new Intl.DateTimeFormat("es", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            }).format(new Date(sport.createdAt))}
                                        </td>
                                        <td className="px-4 py-2 align-top">
                                            <SportRowActions
                                                id={sport.id}
                                                name={sport.name}
                                                deleteSport={deleteSport}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination totalPages={totalPages} />
        </div>
    )
}
