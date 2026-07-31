"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useOptimistic, useTransition } from "react"
import { useForm } from "react-hook-form"

import { deleteClubMemberAction } from "@/app/actions/club"
import { ClubMemberRowActions } from "@/components/club/ClubMemberRowActions"
import { Pagination } from "@/components/ui/pagination/Pagination"
import {
    listFilterButtonClass,
    listFilterFormClass,
    listFilterSearchClass,
} from "@/components/ui/table/list-filter-bar"
import { SortableTh } from "@/components/ui/table/SortableTh"
import { tableHeaderThClass } from "@/components/ui/table/table-header"
import { formatUserDisplayName } from "@/lib/user-display"
import type { ClubMemberListSortBy } from "@/schemas/club.schema"
import type { UserSafe } from "@/services/users.service"

type Props = {
    users: UserSafe[]
    memberCount: number
    maxMembers: number
    totalPages: number
    listState: {
        search: string
        sortBy: ClubMemberListSortBy
        sortDir: "asc" | "desc"
    }
}

interface FormData {
    search: string
}

function defaultSortDir(column: ClubMemberListSortBy): "asc" | "desc" {
    switch (column) {
        case "createdAt":
        case "updatedAt":
            return "desc"
        case "firstName":
        case "lastName":
        case "email":
        case "phoneNumber":
        default:
            return "asc"
    }
}

export function ClubMembersTable({
    users,
    memberCount,
    maxMembers,
    totalPages,
    listState,
}: Props) {
    const router = useRouter()
    const [, startTransition] = useTransition()
    const { register, handleSubmit } = useForm<FormData>({
        defaultValues: { search: listState.search },
    })
    const [optimisticUsers, removeUserOptimistic] = useOptimistic(
        users,
        (current, deletedId: string) => current.filter((u) => u.id !== deletedId),
    )

    const deleteMember = useCallback(
        (id: string) =>
            new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
                startTransition(async () => {
                    const result = await deleteClubMemberAction({ id })
                    if (result.ok) {
                        removeUserOptimistic(id)
                        router.refresh()
                        resolve({ ok: true })
                    } else {
                        resolve({ ok: false, error: result.error })
                    }
                })
            }),
        [removeUserOptimistic, router],
    )

    const onSubmit = (data: FormData) => {
        const p = new URLSearchParams()
        const q = data.search?.trim()
        if (q) p.set("search", q)
        p.set("sortBy", listState.sortBy)
        p.set("sortDir", listState.sortDir)
        router.push(`/club/members?${p.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Cupo:{" "}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {memberCount} / {maxMembers}
                </span>{" "}
                coaches
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className={listFilterFormClass}>
                <input
                    id="search"
                    {...register("search")}
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono"
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
                                    column="lastName"
                                    label="Nombre"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("lastName")}
                                />
                                <SortableTh
                                    column="email"
                                    label="Email"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("email")}
                                />
                                <SortableTh
                                    column="phoneNumber"
                                    label="Teléfono"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("phoneNumber")}
                                />
                                <th scope="col" className={tableHeaderThClass}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                            {optimisticUsers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
                                    >
                                        {listState.search.trim()
                                            ? "No hay coaches con estos filtros."
                                            : "Todavía no hay coaches en el club."}{" "}
                                        <Link
                                            href="/club/members/new"
                                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                        >
                                            Crear uno
                                        </Link>
                                        .
                                    </td>
                                </tr>
                            ) : (
                                optimisticUsers.map((user) => {
                                    const name = formatUserDisplayName(user)
                                    return (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                                        >
                                            <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                                {user.email}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                                {user.phoneNumber?.trim() || "—"}
                                            </td>
                                            <td className="px-4 py-2 align-middle">
                                                <ClubMemberRowActions
                                                    id={user.id}
                                                    displayName={name}
                                                    deleteMember={deleteMember}
                                                />
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
