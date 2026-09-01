import type {
    PaymentMethod,
    PaymentStatus,
    Prisma,
    SubscriptionStatus,
} from "@prisma/client"

import { getPrisma } from "@/lib/prisma"
import type { GetPaymentsPaginatedParams, PaymentListSortBy } from "@/schemas/billing.schema"

const DEFAULT_TAKE = 10

export type PaymentListItem = {
    id: string
    createdAt: Date
    paidAt: Date | null
    amount: number
    currency: string
    status: PaymentStatus
    paymentMethod: PaymentMethod | null
    externalId: string | null
    subscription: {
        id: string
        planName: string
        offerName: string | null
        status: SubscriptionStatus
        startDate: Date
        endDate: Date
    }
    user?: {
        id: string
        firstName: string
        lastName: string
        email: string
    }
}

export type PaymentsPaginatedData = {
    currentPage: number
    totalPages: number
    payments: PaymentListItem[]
}

const paymentInclude = {
    subscription: {
        select: {
            id: true,
            planName: true,
            offerName: true,
            status: true,
            startDate: true,
            endDate: true,
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    },
} satisfies Prisma.PaymentInclude

type PaymentRow = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>

function paymentOrderBy(
    sortBy: PaymentListSortBy,
    sortDir: "asc" | "desc",
): Prisma.PaymentOrderByWithRelationInput {
    switch (sortBy) {
        case "paidAt":
            return { paidAt: sortDir }
        case "amount":
            return { amount: sortDir }
        case "status":
            return { status: sortDir }
        case "createdAt":
        default:
            return { createdAt: sortDir }
    }
}

function mapPaymentRow(row: PaymentRow, includeUser: boolean): PaymentListItem {
    return {
        id: row.id,
        createdAt: row.createdAt,
        paidAt: row.paidAt,
        amount: Number(row.amount),
        currency: row.currency,
        status: row.status,
        paymentMethod: row.paymentMethod,
        externalId: row.externalId,
        subscription: {
            id: row.subscription.id,
            planName: row.subscription.planName,
            offerName: row.subscription.offerName,
            status: row.subscription.status,
            startDate: row.subscription.startDate,
            endDate: row.subscription.endDate,
        },
        user: includeUser
            ? {
                  id: row.subscription.user.id,
                  firstName: row.subscription.user.firstName,
                  lastName: row.subscription.user.lastName,
                  email: row.subscription.user.email,
              }
            : undefined,
    }
}

function buildAdminSearchFilter(search: string | undefined): Prisma.PaymentWhereInput | undefined {
    const term = search?.trim()
    if (!term) return undefined

    return {
        OR: [
            { externalId: { contains: term, mode: "insensitive" } },
            { subscription: { planName: { contains: term, mode: "insensitive" } } },
            { subscription: { offerName: { contains: term, mode: "insensitive" } } },
            { subscription: { user: { email: { contains: term, mode: "insensitive" } } } },
            { subscription: { user: { firstName: { contains: term, mode: "insensitive" } } } },
            { subscription: { user: { lastName: { contains: term, mode: "insensitive" } } } },
        ],
    }
}

async function paymentsListPaginated(
    where: Prisma.PaymentWhereInput,
    params: GetPaymentsPaginatedParams,
    includeUser: boolean,
): Promise<PaymentsPaginatedData> {
    const page = params.page ?? 1
    const take = params.take ?? DEFAULT_TAKE
    const sortBy = params.sortBy ?? "createdAt"
    const sortDir = params.sortDir ?? "desc"
    const skip = (page - 1) * take

    const [total, rows] = await Promise.all([
        getPrisma().payment.count({ where }),
        getPrisma().payment.findMany({
            where,
            include: paymentInclude,
            orderBy: paymentOrderBy(sortBy, sortDir),
            skip,
            take,
        }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / take))

    return {
        currentPage: page,
        totalPages,
        payments: rows.map((row) => mapPaymentRow(row, includeUser)),
    }
}

export async function paymentsListForUser(
    userId: string,
    params: GetPaymentsPaginatedParams,
): Promise<PaymentsPaginatedData> {
    return paymentsListPaginated(
        { subscription: { userId } },
        params,
        false,
    )
}

export async function paymentsListAdmin(
    params: GetPaymentsPaginatedParams,
): Promise<PaymentsPaginatedData> {
    const filters: Prisma.PaymentWhereInput[] = []
    const searchFilter = buildAdminSearchFilter(params.filters?.search)
    if (searchFilter) filters.push(searchFilter)
    if (params.filters?.status) {
        filters.push({ status: params.filters.status })
    }

    const where: Prisma.PaymentWhereInput =
        filters.length > 0 ? { AND: filters } : {}

    return paymentsListPaginated(where, params, true)
}
