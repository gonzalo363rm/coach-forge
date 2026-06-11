export type UserActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; details?: unknown }
