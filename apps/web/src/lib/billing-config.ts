const DEFAULT_BILLING_GRACE_DAYS = 7

export function getBillingGraceDays(): number {
    const raw = process.env.BILLING_GRACE_DAYS?.trim()
    if (!raw) return DEFAULT_BILLING_GRACE_DAYS
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_BILLING_GRACE_DAYS
    return parsed
}

export function getGraceCutoffDate(now: Date = new Date()): Date {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - getBillingGraceDays())
    return cutoff
}

export function getGraceEndsAt(endDate: Date): Date {
    const graceEndsAt = new Date(endDate)
    graceEndsAt.setDate(graceEndsAt.getDate() + getBillingGraceDays())
    return graceEndsAt
}

export function isInGracePeriod(
    endDate: Date,
    now: Date = new Date(),
): boolean {
    return endDate.getTime() <= now.getTime() && getGraceEndsAt(endDate).getTime() > now.getTime()
}
