/** Revalidación: pagos admin */
export const revalidate = 60

import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { PaymentsPaginatedTable } from "@/components/payments/PaymentsPaginatedTable"
import { createPageMetadata } from "@/lib/seo"
import { isStaffRole } from "@/lib/user-permissions"
import {
    getPaymentsPaginatedParamsSchema,
    paymentStatusFilterSchema,
} from "@/schemas/billing.schema"
import { paymentsListAdmin } from "@/services/payments.service"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Pagos",
    description: "Consultá los pagos y suscripciones de Coach Forge.",
    path: "/admin/payments",
    noIndex: true,
})

function firstQueryValue(value: string | string[] | undefined): string {
    if (value === undefined) return ""
    return Array.isArray(value) ? (value[0] ?? "") : value
}

interface Props {
    searchParams: Promise<{
        page?: string | string[]
        search?: string | string[]
        status?: string | string[]
        sortBy?: string | string[]
        sortDir?: string | string[]
    }>
}

export default async function AdminPaymentsPage({ searchParams }: Props) {
    const session = await auth()
    if (!session?.user || !isStaffRole(session.user.role)) {
        redirect("/forbidden")
    }

    const params = await searchParams
    const statusRaw = firstQueryValue(params.status)
    const statusParsed = paymentStatusFilterSchema.safeParse(statusRaw)

    const parsed = getPaymentsPaginatedParamsSchema.safeParse({
        page: firstQueryValue(params.page) || undefined,
        filters: {
            search: firstQueryValue(params.search) || undefined,
            status: statusParsed.success ? statusParsed.data : undefined,
        },
        sortBy: firstQueryValue(params.sortBy) || undefined,
        sortDir: firstQueryValue(params.sortDir) || undefined,
    })

    const query = parsed.success
        ? parsed.data
        : getPaymentsPaginatedParamsSchema.parse({})

    const { currentPage, totalPages, payments } = await paymentsListAdmin(query)

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 sm:p-8">
                <header className="space-y-2">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">Pagos</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Historial de pagos, suscripciones y estados de Mercado Pago.
                    </p>
                </header>

                <PaymentsPaginatedTable
                    payments={payments}
                    totalPages={totalPages}
                    basePath="/admin/payments"
                    showUser
                    listState={{
                        search: query.filters?.search ?? "",
                        status: query.filters?.status ?? "",
                        sortBy: query.sortBy,
                        sortDir: query.sortDir,
                    }}
                />

                {currentPage > totalPages && totalPages > 0 ? (
                    <p className="text-sm text-zinc-500">Página fuera de rango.</p>
                ) : null}
            </main>
        </div>
    )
}
