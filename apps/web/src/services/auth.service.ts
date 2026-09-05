import type { AuthTokenType, User } from "@prisma/client"
import bcryptjs from "bcryptjs"
import { randomBytes } from "crypto"

import type { AuthErrorCode } from "@/app/actions/auth/types"
import { getPrisma } from "@/lib/prisma"
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  signInSchema,
} from "@/schemas/auth.schema"
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/services/email.service"

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000

type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: AuthErrorCode }

type ValidAuthToken = {
  userId: string
  type: AuthTokenType
  token: string
  expires: Date
  user: User
}

function createTokenValue(): string {
  return randomBytes(32).toString("hex")
}

async function createAuthToken(
  userId: string,
  type: AuthTokenType,
  ttlMs: number,
): Promise<string> {
  const prisma = getPrisma()
  const token = createTokenValue()
  const expires = new Date(Date.now() + ttlMs)

  await prisma.authToken.deleteMany({
    where: { userId, type },
  })

  await prisma.authToken.create({
    data: { userId, type, token, expires },
  })

  return token
}

async function deleteAuthToken(
  userId: string,
  type: AuthTokenType,
): Promise<void> {
  const prisma = getPrisma()
  await prisma.authToken.deleteMany({
    where: { userId, type },
  })
}

async function findValidAuthToken(
  token: string,
  type: AuthTokenType,
): Promise<ServiceResult<ValidAuthToken>> {
  const prisma = getPrisma()
  const record = await prisma.authToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!record || record.type !== type) {
    return { ok: false, error: invalidTokenError(type) }
  }

  if (record.expires < new Date()) {
    await deleteAuthToken(record.userId, type)
    return { ok: false, error: expiredTokenError(type) }
  }

  return { ok: true, data: record }
}

function invalidTokenError(type: AuthTokenType): string {
  return type === "email_verification"
    ? "El enlace de verificación no es válido"
    : "El enlace de recuperación no es válido"
}

function expiredTokenError(type: AuthTokenType): string {
  return type === "email_verification"
    ? "El enlace de verificación ha caducado"
    : "El enlace de recuperación ha caducado"
}

export async function authenticateUser(
  input: unknown,
): Promise<ServiceResult<User>> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Datos de inicio de sesión inválidos" }
  }

  const { email, password } = parsed.data
  const prisma = getPrisma()
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } })

  if (!user) {
    return { ok: false, error: "Email o contraseña incorrectos" }
  }

  const passwordsMatch = await bcryptjs.compare(password, user.passwordHash)
  if (!passwordsMatch) {
    return { ok: false, error: "Email o contraseña incorrectos" }
  }

  if (!user.emailVerified) {
    return {
      ok: false,
      error: "Debes verificar tu email antes de iniciar sesión",
      code: "EMAIL_NOT_VERIFIED",
    }
  }

  return { ok: true, data: user }
}

export async function resendVerificationEmail(
  input: unknown,
): Promise<ServiceResult<{ email: string }>> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos" }
  }

  const { email, password } = parsed.data
  const prisma = getPrisma()
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } })

  if (!user) {
    return { ok: false, error: "Email o contraseña incorrectos" }
  }

  const passwordsMatch = await bcryptjs.compare(password, user.passwordHash)
  if (!passwordsMatch) {
    return { ok: false, error: "Email o contraseña incorrectos" }
  }

  if (user.emailVerified) {
    return { ok: false, error: "Tu email ya está verificado" }
  }

  const token = await createAuthToken(
    user.id,
    "email_verification",
    VERIFICATION_TTL_MS,
  )
  const emailResult = await sendVerificationEmail({
    to: email,
    firstName: user.firstName,
    token,
  })

  if (!emailResult.ok) return emailResult

  return { ok: true, data: { email } }
}

export async function registerUser(
  input: unknown,
): Promise<ServiceResult<{ email: string }>> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Datos de registro inválidos" }
  }

  const {
    firstName,
    lastName,
    email,
    password,
    accountType,
    clubName,
    clubAddress,
  } = parsed.data
  const prisma = getPrisma()

  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } })
  if (existing) {
    if (existing.emailVerified) {
      return { ok: false, error: "Ya existe una cuenta con ese email" }
    }

    // Cuenta sin verificar: actualizar datos y, si es registro de club, asegurar Club.
    const passwordHash = await bcryptjs.hash(password, 12)
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existing.id },
        data: {
          firstName,
          lastName,
          passwordHash,
          role: accountType === "club" ? "club_manager" : "coach",
        },
      })

      if (accountType === "club") {
        const club = await tx.club.findUnique({ where: { managerId: existing.id } })
        if (!club) {
          await tx.club.create({
            data: {
              name: clubName!.trim(),
              address: clubAddress?.trim() ? clubAddress.trim() : null,
              managerId: existing.id,
              maxMembers: 20,
            },
          })
        }
      }
    })

    const token = await createAuthToken(
      existing.id,
      "email_verification",
      VERIFICATION_TTL_MS,
    )
    const emailResult = await sendVerificationEmail({
      to: email,
      firstName,
      token,
    })

    if (!emailResult.ok) return emailResult

    return {
      ok: true,
      data: { email },
    }
  }

  const passwordHash = await bcryptjs.hash(password, 12)

  const user =
    accountType === "club"
      ? await prisma.$transaction(async (tx) => {
          const manager = await tx.user.create({
            data: {
              firstName,
              lastName,
              email,
              passwordHash,
              role: "club_manager",
            },
          })
          await tx.club.create({
            data: {
              name: clubName!.trim(),
              address: clubAddress?.trim() ? clubAddress.trim() : null,
              managerId: manager.id,
              maxMembers: 20,
            },
          })
          return manager
        })
      : await prisma.user.create({
          data: {
            firstName,
            lastName,
            email,
            passwordHash,
          },
        })

  const token = await createAuthToken(
    user.id,
    "email_verification",
    VERIFICATION_TTL_MS,
  )
  const emailResult = await sendVerificationEmail({
    to: email,
    firstName,
    token,
  })

  if (!emailResult.ok) {
    await prisma.user.delete({ where: { id: user.id } })
    await deleteAuthToken(user.id, "email_verification")
    return emailResult
  }

  return { ok: true, data: { email } }
}

export async function verifyEmailToken(
  token: string,
): Promise<ServiceResult<User>> {
  if (!token.trim()) {
    return { ok: false, error: "Token de verificación inválido" }
  }

  const tokenResult = await findValidAuthToken(token, "email_verification")
  if (!tokenResult.ok) return tokenResult

  const { user } = tokenResult.data

  if (user.emailVerified) {
    await deleteAuthToken(user.id, "email_verification")
    return { ok: true, data: user }
  }

  const prisma = getPrisma()
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  })

  await deleteAuthToken(user.id, "email_verification")

  return { ok: true, data: updated }
}

export async function requestPasswordReset(
  input: unknown,
): Promise<ServiceResult<{ email: string }>> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Introduce un email válido" }
  }

  const { email } = parsed.data
  const prisma = getPrisma()
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } })

  if (user) {
    const token = await createAuthToken(
      user.id,
      "password_reset",
      PASSWORD_RESET_TTL_MS,
    )
    const emailResult = await sendPasswordResetEmail({
      to: email,
      firstName: user.firstName,
      token,
    })

    if (!emailResult.ok) {
      console.error("Password reset email failed:", emailResult.error)
    }
  }

  return { ok: true, data: { email } }
}

export async function resetPasswordWithToken(
  input: unknown,
): Promise<ServiceResult<void>> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Datos de recuperación inválidos" }
  }

  const { token, password } = parsed.data
  const tokenResult = await findValidAuthToken(token, "password_reset")
  if (!tokenResult.ok) return tokenResult

  const { user } = tokenResult.data
  const prisma = getPrisma()
  const passwordHash = await bcryptjs.hash(password, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  await deleteAuthToken(user.id, "password_reset")

  return { ok: true, data: undefined }
}
