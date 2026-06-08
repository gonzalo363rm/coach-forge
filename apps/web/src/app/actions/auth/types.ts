export type AuthErrorCode = "EMAIL_NOT_VERIFIED"

export type AuthActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: AuthErrorCode; details?: unknown }
