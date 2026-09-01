/** Revalidación: mis pagos */
export const revalidate = 60

import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { PaymentsPaginatedTable } from "@/components/payments/PaymentsPaginatedTable"
import { resolveBillingSubject } from "@/lib/entitlements"
import { createPageMetadata } from "@/lib/seo"
import { getPaymentsPaginatedParamsSchema } from "@/schemas/billing.schema"
import { paymentsListForUser } from "@/services/payments.service"

export const metadata: Metadata = createPageMetadata({
    title: "Mis pagos",
    description: "Consultá tu historial de pagos y suscripciones en Coach Forge.",
    path: "/payments/mine",
    noIndex: true,
})

function firstQueryValue(value: string | string[] | undefined): string {
    if (value === undefined) return ""
    return Array.isArray(value) ? (value[0] ?? "") : value
}

interface Props {
    searchParams: Promise<{
        page?: string | string[]
        sortBy?: string | string[]
        sortDir?: string | string[]
    }>
}

export default async function MyPaymentsPage({ searchParams }: Props) {
    const session = await auth()
    if (!session?.user) {
        redirect("/login?callbackUrl=/payments/mine")
    }

    const subject = await resolveBillingSubject(session.user.id)
    if (!subject?.canManageBilling) {
        redirect("/forbidden")
    }

    const rawParams = await searchParams
    const parsed = getPaymentsPaginatedParamsSchema.safeParse({
        page: firstQueryValue(rawParams.page) || undefined,
        sortBy: firstQueryValue(rawParams.sortBy) || undefined,
        sortDir: firstQueryValue(rawParams.sortDir) || undefined,
    })

    const query = parsed.success
        ? parsed.data
        : getPaymentsPaginatedParamsSchema.parse({})

    const { currentPage, totalPages, payments } = await paymentsListForUser(
        subject.titularUserId,
        query,
    )

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 sm:p-8">
                <header className="space-y-2">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                        Mis pagos
                    </h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Historial de pagos y suscripciones de tu cuenta.
                    </p>
                </header>

                <PaymentsPaginatedTable
                    payments={payments}
                    totalPages={totalPages}
                    basePath="/payments/mine"
                    showUser={false}
                    listState={{
                        search: "",
                        status: "",
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
