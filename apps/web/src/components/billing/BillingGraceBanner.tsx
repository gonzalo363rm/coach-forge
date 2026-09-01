import Link from "next/link"

import { auth } from "@/auth"
import { formatBillingDateTime } from "@/lib/billing-labels"
import { getEffectiveEntitlements } from "@/lib/entitlements"

export async function BillingGraceBanner() {
    const session = await auth()
    if (!session?.user) return null

    const { inGracePeriod, graceEndsAt, planName, subject } = await getEffectiveEntitlements(
        session.user.id,
    )

    if (!inGracePeriod || !graceEndsAt || !subject?.canManageBilling) {
        return null
    }

    return (
        <div
            role="status"
            className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
        >
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
                <p>
                    Tu plan{planName ? ` ${planName}` : ""} venció. Renovalo antes del{" "}
                    <span className="font-medium">{formatBillingDateTime(graceEndsAt)}</span> para
                    seguir disfrutando de nuestros servicios.
                </p>
                <Link
                    href="/plans"
                    className="shrink-0 font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700 dark:text-amber-200 dark:hover:text-amber-50"
                >
                    Ver planes
                </Link>
            </div>
        </div>
    )
}
