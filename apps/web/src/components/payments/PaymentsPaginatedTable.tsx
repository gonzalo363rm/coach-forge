"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

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
    formatBillingDateTime,
    formatPaymentMethod,
    formatPaymentStatus,
    formatSubscriptionStatus,
} from "@/lib/billing-labels"
import { formatMoneyArs } from "@/lib/plan-pricing"
import { formatUserDisplayName } from "@/lib/user-display"
import type { PaymentListSortBy, PaymentStatusFilter } from "@/schemas/billing.schema"
import type { PaymentListItem } from "@/services/payments.service"

type Props = {
    payments: PaymentListItem[]
    totalPages: number
    basePath: "/admin/payments" | "/payments/mine"
    showUser: boolean
    listState: {
        search: string
        status: PaymentStatusFilter | ""
        sortBy: PaymentListSortBy
        sortDir: "asc" | "desc"
    }
}

interface FormData {
    search: string
    status: PaymentStatusFilter | ""
}

function defaultSortDir(column: PaymentListSortBy): "asc" | "desc" {
    switch (column) {
        case "amount":
        case "createdAt":
        case "paidAt":
        default:
            return "desc"
        case "status":
            return "asc"
    }
}

function paymentStatusClass(status: PaymentListItem["status"]): string {
    switch (status) {
        case "completed":
            return "text-emerald-700 dark:text-emerald-400"
        case "pending":
            return "text-amber-700 dark:text-amber-400"
        case "failed":
            return "text-red-700 dark:text-red-400"
        case "cancelled":
            return "text-zinc-500 dark:text-zinc-400"
    }
}

export function PaymentsPaginatedTable({
    payments,
    totalPages,
    basePath,
    showUser,
    listState,
}: Props) {
    const router = useRouter()
    const { register, handleSubmit } = useForm<FormData>({
        defaultValues: {
            search: listState.search,
            status: listState.status,
        },
    })

    const onSubmit = (data: FormData) => {
        const params = new URLSearchParams()
        const query = data.search?.trim()
        if (query) params.set("search", query)
        if (data.status) params.set("status", data.status)
        params.set("sortBy", listState.sortBy)
        params.set("sortDir", listState.sortDir)
        router.push(`${basePath}?${params.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            {showUser ? (
                <form onSubmit={handleSubmit(onSubmit)} className={listFilterFormClass}>
                    <input
                        id="search"
                        {...register("search")}
                        type="text"
                        placeholder="Buscar por usuario, plan o ID de pago"
                        className={listFilterSearchClass}
                    />
                    <select {...register("status")} className={listFilterSelectClass}>
                        <option value="">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="completed">Completado</option>
                        <option value="failed">Fallido</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                    <button type="submit" className={listFilterButtonClass}>
                        Buscar
                    </button>
                </form>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-100 dark:bg-zinc-900">
                            <tr>
                                <SortableTh
                                    column="createdAt"
                                    label="Fecha"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("createdAt")}
                                />
                                {showUser ? (
                                    <th className={tableHeaderThClass}>Usuario</th>
                                ) : null}
                                <th className={tableHeaderThClass}>Plan</th>
                                <SortableTh
                                    column="amount"
                                    label="Monto"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("amount")}
                                />
                                <SortableTh
                                    column="status"
                                    label="Estado"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("status")}
                                />
                                <th className={tableHeaderThClass}>Método</th>
                                <th className={tableHeaderThClass}>Suscripción</th>
                                {showUser ? (
                                    <th className={tableHeaderThClass}>ID externo</th>
                                ) : null}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                            {payments.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={showUser ? 8 : 6}
                                        className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                                    >
                                        Todavía no hay pagos registrados.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                            <div>{formatBillingDateTime(payment.createdAt)}</div>
                                            {payment.paidAt ? (
                                                <div className="text-xs text-zinc-500">
                                                    Pagado: {formatBillingDateTime(payment.paidAt)}
                                                </div>
                                            ) : null}
                                        </td>
                                        {showUser && payment.user ? (
                                            <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                                <div className="font-medium">
                                                    {formatUserDisplayName(payment.user)}
                                                </div>
                                                <div className="text-xs text-zinc-500">
                                                    {payment.user.email}
                                                </div>
                                            </td>
                                        ) : showUser ? (
                                            <td className="px-4 py-3 text-sm text-zinc-500">—</td>
                                        ) : null}
                                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                            <div className="font-medium">
                                                {payment.subscription.planName}
                                            </div>
                                            {payment.subscription.offerName ? (
                                                <div className="text-xs text-zinc-500">
                                                    {payment.subscription.offerName}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                            {formatMoneyArs(payment.amount)}
                                        </td>
                                        <td
                                            className={`whitespace-nowrap px-4 py-3 text-sm font-medium ${paymentStatusClass(payment.status)}`}
                                        >
                                            {formatPaymentStatus(payment.status)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            {formatPaymentMethod(payment.paymentMethod)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            <div>{formatSubscriptionStatus(payment.subscription.status)}</div>
                                            <div className="text-xs text-zinc-500">
                                                {formatBillingDateTime(payment.subscription.startDate)}{" "}
                                                – {formatBillingDateTime(payment.subscription.endDate)}
                                            </div>
                                        </td>
                                        {showUser ? (
                                            <td className="max-w-40 truncate px-4 py-3 text-xs text-zinc-500">
                                                {payment.externalId ?? "—"}
                                            </td>
                                        ) : null}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 ? <Pagination totalPages={totalPages} /> : null}
        </div>
    )
}
