export type ExerciseActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; details?: unknown }
