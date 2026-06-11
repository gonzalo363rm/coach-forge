"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useOptimistic, useTransition } from "react"
import { useForm } from "react-hook-form"

import { deleteUserAction } from "@/app/actions/users"
import { UserRowActions } from "@/components/users/UserRowActions"
import { Pagination } from "@/components/ui/pagination/Pagination"
import {
    listFilterButtonClass,
    listFilterFormClass,
    listFilterSearchClass,
    listFilterSelectClass,
} from "@/components/ui/table/list-filter-bar"
import { SortableTh } from "@/components/ui/table/SortableTh"
import { tableHeaderThClass } from "@/components/ui/table/table-header"
import {
    canAdminDeleteUser,
    canAdminEditUser,
    filterableRolesForActor,
    formatUserRole,
} from "@/lib/user-permissions"
import type { UserListSortBy } from "@/schemas/user.schema"
import type { UserSafe } from "@/services/users.service"
import type { Role } from "@prisma/client"

type Props = {
    users: UserSafe[]
    totalPages: number
    actorRole: Role
    actorId: string
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

export function UsersPaginatedTable({
    users,
    totalPages,
    actorRole,
    actorId,
    listState,
}: Props) {
    const filterableRoles = filterableRolesForActor(actorRole)
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
        router.push(`/admin/users?${p.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={handleSubmit(onSubmit)} className={listFilterFormClass}>
                <input
                    id="search"
                    {...register("search")}
                    type="text"
                    placeholder="Buscar por nombre o email"
                    className={listFilterSearchClass}
                />
                <select {...register("role")} className={listFilterSelectClass}>
                    <option value="">Todos los roles</option>
                    {filterableRoles.map((role) => (
                        <option key={role} value={role}>
                            {formatUserRole(role)}
                        </option>
                    ))}
                </select>
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
                                    className={tableHeaderThClass}
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
                                    className={tableHeaderThClass}
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
                                            href="/admin/users/new"
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
                                        <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {user.email}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {formatUserRole(user.role)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {user.emailVerified ? "Sí" : "No"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            {new Intl.DateTimeFormat("es", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            }).format(new Date(user.updatedAt))}
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            <UserRowActions
                                                id={user.id}
                                                displayName={`${user.firstName} ${user.lastName}`}
                                                deleteUser={deleteUser}
                                                canEdit={canAdminEditUser(
                                                    actorRole,
                                                    actorId,
                                                    user,
                                                )}
                                                canDelete={canAdminDeleteUser(
                                                    actorRole,
                                                    actorId,
                                                    user,
                                                )}
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
