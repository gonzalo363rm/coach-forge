import type { User } from "@prisma/client"
import bcryptjs from "bcryptjs"
import { randomBytes } from "crypto"

import type { AuthErrorCode } from "@/app/actions/auth/types"
import { getPrisma } from "@/lib/prisma"
import { registerSchema, signInSchema } from "@/schemas/auth.schema"
import { sendVerificationEmail } from "@/services/email.service"

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000

type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: AuthErrorCode }

function createVerificationToken(): string {
  return randomBytes(32).toString("hex")
}

async function createEmailVerificationToken(email: string): Promise<string> {
  const prisma = getPrisma()
  const token = createVerificationToken()
  const expires = new Date(Date.now() + VERIFICATION_TTL_MS)

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  return token
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
  const user = await prisma.user.findUnique({ where: { email } })

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
  const user = await prisma.user.findUnique({ where: { email } })

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

  const token = await createEmailVerificationToken(email)
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

  const { firstName, lastName, email, password } = parsed.data
  const prisma = getPrisma()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    if (existing.emailVerified) {
      return { ok: false, error: "Ya existe una cuenta con ese email" }
    }

    const token = await createEmailVerificationToken(email)
    const emailResult = await sendVerificationEmail({
      to: email,
      firstName: existing.firstName,
      token,
    })

    if (!emailResult.ok) return emailResult

    return {
      ok: true,
      data: { email },
    }
  }

  const passwordHash = await bcryptjs.hash(password, 12)

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
    },
  })

  const token = await createEmailVerificationToken(email)
  const emailResult = await sendVerificationEmail({
    to: email,
    firstName,
    token,
  })

  if (!emailResult.ok) {
    await prisma.user.delete({ where: { email } })
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
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

  const prisma = getPrisma()
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record) {
    return { ok: false, error: "El enlace de verificación no es válido" }
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token } },
    })
    return { ok: false, error: "El enlace de verificación ha caducado" }
  }

  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
  })

  if (!user) {
    return { ok: false, error: "No se encontró la cuenta asociada al enlace" }
  }

  if (user.emailVerified) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    })
    return { ok: true, data: user }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  })

  await prisma.verificationToken.deleteMany({
    where: { identifier: record.identifier },
  })

  return { ok: true, data: updated }
}
