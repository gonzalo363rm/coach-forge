"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { ButtonLink } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination/Pagination"
import {
    listFilterButtonClass,
    listFilterFormClass,
    listFilterSearchClass,
} from "@/components/ui/table/list-filter-bar"
import { SortableTh } from "@/components/ui/table/SortableTh"
import { tableHeaderThClass } from "@/components/ui/table/table-header"
import { formatUserDisplayName } from "@/lib/user-display"
import type { ClubListSortBy } from "@/schemas/club.schema"
import type { ClubListItem } from "@/services/clubs.service"

type Props = {
    clubs: ClubListItem[]
    totalPages: number
    listState: {
        search: string
        sortBy: ClubListSortBy
        sortDir: "asc" | "desc"
    }
}

interface FormData {
    search: string
}

function defaultSortDir(column: ClubListSortBy): "asc" | "desc" {
    switch (column) {
        case "name":
            return "asc"
        case "maxMembers":
        case "createdAt":
        case "updatedAt":
        default:
            return "desc"
    }
}

export function ClubsPaginatedTable({ clubs, totalPages, listState }: Props) {
    const router = useRouter()
    const { register, handleSubmit } = useForm<FormData>({
        defaultValues: { search: listState.search },
    })

    const onSubmit = (data: FormData) => {
        const p = new URLSearchParams()
        const q = data.search?.trim()
        if (q) p.set("search", q)
        p.set("sortBy", listState.sortBy)
        p.set("sortDir", listState.sortDir)
        router.push(`/admin/clubs?${p.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={handleSubmit(onSubmit)} className={listFilterFormClass}>
                <input
                    id="search"
                    {...register("search")}
                    type="text"
                    placeholder="Buscar por club, dueño o email"
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
                                <SortableTh
                                    column="name"
                                    label="Club"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("name")}
                                />
                                <th scope="col" className={tableHeaderThClass}>
                                    Dueño
                                </th>
                                <SortableTh
                                    column="maxMembers"
                                    label="Cupo"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("maxMembers")}
                                />
                                <SortableTh
                                    column="updatedAt"
                                    label="Actualizado"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("updatedAt")}
                                />
                                <th scope="col" className={tableHeaderThClass}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                            {clubs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
                                    >
                                        No hay clubes con estos filtros.
                                    </td>
                                </tr>
                            ) : (
                                clubs.map((club) => {
                                    const ownerName = formatUserDisplayName(club.manager)
                                    return (
                                        <tr
                                            key={club.id}
                                            className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                                        >
                                            <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {club.name}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                                <div className="flex flex-col">
                                                    <Link
                                                        href={`/admin/users/${club.manager.id}/edit`}
                                                        className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                                    >
                                                        {ownerName}
                                                    </Link>
                                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        {club.manager.email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                                {club.memberCount} / {club.maxMembers}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                                                {new Intl.DateTimeFormat("es", {
                                                    dateStyle: "short",
                                                    timeStyle: "short",
                                                }).format(new Date(club.updatedAt))}
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                <ButtonLink
                                                    href={`/admin/clubs/${club.id}/edit`}
                                                    variant="secondary"
                                                    size="sm"
                                                >
                                                    Editar
                                                </ButtonLink>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination totalPages={totalPages} />
        </div>
    )
}
