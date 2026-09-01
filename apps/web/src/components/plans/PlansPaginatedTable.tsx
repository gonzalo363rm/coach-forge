"use client"

import type { Plan } from "@prisma/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { PlanRowActions } from "@/components/plans/PlanRowActions"
import { Pagination } from "@/components/ui/pagination/Pagination"
import {
    listFilterButtonClass,
    listFilterFormClass,
    listFilterSearchClass,
} from "@/components/ui/table/list-filter-bar"
import { SortableTh } from "@/components/ui/table/SortableTh"
import { tableHeaderThClass } from "@/components/ui/table/table-header"
import { formatCatalogStatus, formatPlanCatalogRole, formatPlanType } from "@/lib/billing-labels"
import type { PlanListSortBy } from "@/schemas/billing.schema"

type Props = {
    plans: Plan[]
    totalPages: number
    listState: {
        search: string
        type: string
        status: string
        sortBy: PlanListSortBy
        sortDir: "asc" | "desc"
    }
}

interface FormData {
    search: string
    type: string
    status: string
}

function defaultSortDir(column: PlanListSortBy): "asc" | "desc" {
    return column === "createdAt" ? "desc" : "asc"
}

export function PlansPaginatedTable({ plans, totalPages, listState }: Props) {
    const router = useRouter()
    const { register, handleSubmit } = useForm<FormData>({
        defaultValues: {
            search: listState.search,
            type: listState.type,
            status: listState.status,
        },
    })

    const onSubmit = (data: FormData) => {
        const p = new URLSearchParams()
        const q = data.search?.trim()
        if (q) p.set("search", q)
        if (data.type) p.set("type", data.type)
        if (data.status) p.set("status", data.status)
        p.set("sortBy", listState.sortBy)
        p.set("sortDir", listState.sortDir)
        router.push(`/admin/plans?${p.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={handleSubmit(onSubmit)} className={listFilterFormClass}>
                <input
                    {...register("search")}
                    type="text"
                    placeholder="Buscar por nombre"
                    className={listFilterSearchClass}
                />
                <select {...register("type")} className={listFilterSearchClass}>
                    <option value="">Todos los tipos</option>
                    <option value="individual">Individual</option>
                    <option value="club">Club</option>
                </select>
                <select {...register("status")} className={listFilterSearchClass}>
                    <option value="">Todos los estados</option>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
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
                                    column="name"
                                    label="Nombre"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("name")}
                                />
                                <th scope="col" className={tableHeaderThClass}>
                                    Descripción
                                </th>
                                <SortableTh
                                    column="type"
                                    label="Tipo"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("type")}
                                />
                                <th scope="col" className={tableHeaderThClass}>
                                    Catálogo
                                </th>
                                <SortableTh
                                    column="status"
                                    label="Estado"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("status")}
                                />
                                <th scope="col" className={tableHeaderThClass}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                            {plans.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
                                    >
                                        No hay planes con estos filtros.{" "}
                                        <Link
                                            href="/admin/plans/new"
                                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                        >
                                            Crear el primero
                                        </Link>
                                        .
                                    </td>
                                </tr>
                            ) : (
                                plans.map((plan) => (
                                    <tr
                                        key={plan.id}
                                        className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                                    >
                                        <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {plan.name}
                                        </td>
                                        <td className="max-w-xs px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {plan.description ? (
                                                <span className="line-clamp-2">{plan.description}</span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {formatPlanType(plan.type)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {formatPlanCatalogRole(plan.catalogRole) ?? "—"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {formatCatalogStatus(plan.status)}
                                        </td>
                                        <td className="px-4 py-2 align-top">
                                            <PlanRowActions id={plan.id} status={plan.status} />
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
