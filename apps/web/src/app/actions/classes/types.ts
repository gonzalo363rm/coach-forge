export type ClassActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string; details?: unknown }
