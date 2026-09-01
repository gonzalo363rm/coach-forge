"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { DiscountRowActions } from "@/components/discounts/DiscountRowActions"
import { Pagination } from "@/components/ui/pagination/Pagination"
import {
    listFilterButtonClass,
    listFilterFormClass,
    listFilterSearchClass,
} from "@/components/ui/table/list-filter-bar"
import { SortableTh } from "@/components/ui/table/SortableTh"
import { tableHeaderThClass } from "@/components/ui/table/table-header"
import { formatCatalogStatus } from "@/lib/billing-labels"
import { formatMoneyArs } from "@/lib/plan-pricing"
import type { DiscountListSortBy } from "@/schemas/billing.schema"
import type { DiscountListItem } from "@/services/discounts.service"

type Props = {
    discounts: DiscountListItem[]
    totalPages: number
    listState: {
        search: string
        status: string
        sortBy: DiscountListSortBy
        sortDir: "asc" | "desc"
    }
}

interface FormData {
    search: string
    status: string
}

export function DiscountsPaginatedTable({ discounts, totalPages, listState }: Props) {
    const router = useRouter()
    const { register, handleSubmit } = useForm<FormData>({
        defaultValues: { search: listState.search, status: listState.status },
    })

    const onSubmit = (data: FormData) => {
        const p = new URLSearchParams()
        const q = data.search?.trim()
        if (q) p.set("search", q)
        if (data.status) p.set("status", data.status)
        p.set("sortBy", listState.sortBy)
        p.set("sortDir", listState.sortDir)
        router.push(`/admin/discounts?${p.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={handleSubmit(onSubmit)} className={listFilterFormClass}>
                <input
                    {...register("search")}
                    type="text"
                    placeholder="Buscar por nombre o código"
                    className={listFilterSearchClass}
                />
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
                                    defaultDir="asc"
                                />
                                <SortableTh
                                    column="type"
                                    label="Tipo"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir="asc"
                                />
                                <th scope="col" className={tableHeaderThClass}>
                                    Valor
                                </th>
                                <th scope="col" className={tableHeaderThClass}>
                                    Código
                                </th>
                                <SortableTh
                                    column="status"
                                    label="Estado"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir="asc"
                                />
                                <th scope="col" className={tableHeaderThClass}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                            {discounts.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
                                    >
                                        No hay descuentos.{" "}
                                        <Link
                                            href="/admin/discounts/new"
                                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                        >
                                            Crear el primero
                                        </Link>
                                        .
                                    </td>
                                </tr>
                            ) : (
                                discounts.map((discount) => (
                                    <tr
                                        key={discount.id}
                                        className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                                    >
                                        <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {discount.name}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {discount.type === "percentage"
                                                ? "Porcentaje"
                                                : "Monto fijo"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {discount.type === "percentage"
                                                ? `${discount.value}%`
                                                : formatMoneyArs(Number(discount.value))}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {discount.code ?? "—"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {formatCatalogStatus(discount.status)}
                                        </td>
                                        <td className="px-4 py-2 align-top">
                                            <DiscountRowActions
                                                id={discount.id}
                                                status={discount.status}
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
