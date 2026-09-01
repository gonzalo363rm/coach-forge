export type BillingActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; details?: unknown }
