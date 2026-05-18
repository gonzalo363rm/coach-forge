export type ElementActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; details?: unknown }
