export type SportActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; details?: unknown }
