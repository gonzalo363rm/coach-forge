export type ClubAdminActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; details?: unknown }
