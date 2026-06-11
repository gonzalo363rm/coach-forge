"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useOptimistic, useTransition } from "react"
import { useForm } from "react-hook-form"

import { deleteUserAction } from "@/app/actions/users"
import { UserRowActions } from "@/components/users/UserRowActions"
import { Pagination } from "@/components/ui/pagination/Pagination"
import { SortableTh } from "@/components/ui/table/SortableTh"
import type { UserListSortBy } from "@/schemas/user.schema"
import type { UserSafe } from "@/services/users.service"

type Props = {
    users: UserSafe[]
    totalPages: number
    listState: {
        search: string
        role: string
        sortBy: UserListSortBy
        sortDir: "asc" | "desc"
    }
}

interface FormData {
    search: string
    role: string
}

function defaultSortDir(column: UserListSortBy): "asc" | "desc" {
    switch (column) {
        case "firstName":
        case "lastName":
        case "email":
            return "asc"
        case "role":
        case "createdAt":
        case "updatedAt":
        default:
            return "desc"
    }
}

function formatRole(role: UserSafe["role"]): string {
    return role === "admin" ? "Administrador" : "Entrenador"
}

export function UsersPaginatedTable({ users, totalPages, listState }: Props) {
    const router = useRouter()
    const [, startTransition] = useTransition()
    const { register, handleSubmit } = useForm<FormData>({
        defaultValues: {
            search: listState.search,
            role: listState.role,
        },
    })
    const [optimisticUsers, removeUserOptimistic] = useOptimistic(
        users,
        (current, deletedId: string) => current.filter((u) => u.id !== deletedId),
    )

    const deleteUser = useCallback(
        (id: string) =>
            new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
                startTransition(async () => {
                    const result = await deleteUserAction(id)
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
        if (data.role) p.set("role", data.role)
        p.set("sortBy", listState.sortBy)
        p.set("sortDir", listState.sortDir)
        router.push(`/users/list?${p.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex w-full flex-wrap items-center justify-start gap-3"
            >
                <input
                    id="search"
                    {...register("search")}
                    type="text"
                    placeholder="Buscar por nombre o email"
                    className="min-w-32 flex-1 rounded border border-zinc-300 bg-white p-0.5 dark:border-zinc-600 dark:bg-zinc-700 sm:max-w-xs"
                />
                <select
                    {...register("role")}
                    className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                >
                    <option value="">Todos los roles</option>
                    <option value="admin">Administrador</option>
                    <option value="coach">Entrenador</option>
                </select>
                <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                    Buscar
                </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-100 dark:bg-zinc-900">
                            <tr>
                                <SortableTh
                                    column="firstName"
                                    label="Nombre"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("firstName")}
                                />
                                <SortableTh
                                    column="email"
                                    label="Email"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("email")}
                                />
                                <SortableTh
                                    column="role"
                                    label="Rol"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("role")}
                                />
                                <th
                                    scope="col"
                                    className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                                >
                                    Verificado
                                </th>
                                <SortableTh
                                    column="updatedAt"
                                    label="Actualizado"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("updatedAt")}
                                />
                                <th
                                    scope="col"
                                    className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                            {optimisticUsers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
                                    >
                                        No hay usuarios con estos filtros.{" "}
                                        <Link
                                            href="/users/new"
                                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                        >
                                            Crear el primero
                                        </Link>
                                        .
                                    </td>
                                </tr>
                            ) : (
                                optimisticUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                            {user.email}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                            {formatRole(user.role)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                            {user.emailVerified ? "Sí" : "No"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            {new Intl.DateTimeFormat("es", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            }).format(new Date(user.updatedAt))}
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                            <UserRowActions
                                                id={user.id}
                                                displayName={`${user.firstName} ${user.lastName}`}
                                                deleteUser={deleteUser}
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
